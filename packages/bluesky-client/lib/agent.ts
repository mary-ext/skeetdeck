import { EventEmitter } from './events.js';
import { decodeJwt } from './jwt.js';

import { type FetchHandlerResponse, defaultFetchHandler, isErrorResponse, XRPC } from './xrpc.js';
import { type Headers, ResponseType, httpResponseCodeToEnum, XRPCError } from './xrpc-utils.js';

import type {
	At,
	ComAtprotoServerCreateSession,
	ComAtprotoServerRefreshSession,
	Procedures,
	Queries,
} from './atp-schema.js';

export interface JwtToken {
	exp: number;
	iat: number;
}

export interface AtpAccessJwt extends JwtToken {
	scope: 'com.atproto.access' | 'com.atproto.appPass';
	sub: At.DID;
}

export interface AtpRefreshJwt extends JwtToken {
	scope: 'com.atproto.refresh';
	sub: At.DID;
	aud: string;
	jti: string;
}

export interface AtpSessionData {
	refreshJwt: string;
	accessJwt: string;
	handle: string;
	did: At.DID;
	pdsUri?: string;
	email?: string;
	emailConfirmed?: boolean;
}

export type AgentEventMap = {
	sessionExpired: () => void;
	sessionUpdate: (session: AtpSessionData) => void;
};

export interface AgentOptions {
	serviceUri: string;
	fetch?: typeof defaultFetchHandler;
}

export class Agent extends EventEmitter<AgentEventMap> {
	rpc: XRPC<Queries, Procedures>;
	fetch: typeof defaultFetchHandler;

	serviceUri: string;
	session?: AtpSessionData;

	#refreshSessionPromise?: Promise<void>;

	constructor(options: AgentOptions) {
		super();

		this.fetch = options.fetch ?? defaultFetchHandler;

		this.serviceUri = options.serviceUri;

		this.rpc = new XRPC(this.serviceUri);
		this.rpc.fetch = this.#fetch.bind(this);
	}

	async login(options: AtpLoginOptions): Promise<AtpSessionData> {
		this.#resetSession();

		const res = await this.rpc.call('com.atproto.server.createSession', {
			data: {
				identifier: options.identifier,
				password: options.password,
			},
		});

		return this.#updateSession(res.data);
	}

	async resumeSession(session: AtpSessionData): Promise<AtpSessionData> {
		const now = Date.now() / 1000 + 60 * 5;

		const refreshToken = decodeJwt(session.refreshJwt) as AtpRefreshJwt;

		if (now >= refreshToken.exp) {
			throw new XRPCError(401, 'InvalidToken');
		}

		const accessToken = decodeJwt(session.accessJwt) as AtpAccessJwt;
		this.#resetSession(session);

		if (now >= accessToken.exp) {
			await this.#refreshSession();
		} else {
			const promise = this.rpc.get('com.atproto.server.getSession', {});

			promise.then((response) => {
				const existing = this.session;
				const next = response.data;

				if (!existing) {
					return;
				}

				this.#updateSession({
					...existing,
					handle: next.handle,
					didDoc: next.didDoc,
					email: next.email,
					emailConfirmed: next.emailConfirmed,
				});
			});
		}

		if (!this.session) {
			throw new XRPCError(401, 'InvalidToken');
		}

		return this.session;
	}

	async #fetch(
		httpUri: string,
		httpMethod: string,
		httpHeaders: Headers,
		httpReqBody: unknown,
		signal: AbortSignal | undefined,
	): Promise<FetchHandlerResponse> {
		await this.#refreshSessionPromise;

		let res = await this.fetch(httpUri, httpMethod, this.#addAuthHeader(httpHeaders), httpReqBody, signal);

		if (isErrorResponse(res.body, ['ExpiredToken']) && this.session?.refreshJwt) {
			// refresh session
			await this.#refreshSession();

			if (this.session) {
				// retry fetch
				res = await this.fetch(httpUri, httpMethod, this.#addAuthHeader(httpHeaders), httpReqBody, signal);
			}
		}

		return res;
	}

	#addAuthHeader(httpHeaders: Headers) {
		const session = this.session;

		if (!httpHeaders['authorization'] && session) {
			return {
				...httpHeaders,
				authorization: `Bearer ${session.accessJwt}`,
			};
		}

		return httpHeaders;
	}

	async #refreshSession() {
		if (this.#refreshSessionPromise) {
			return this.#refreshSessionPromise;
		}

		this.#refreshSessionPromise = this.#refreshSessionInner();

		try {
			await this.#refreshSessionPromise;
		} finally {
			this.#refreshSessionPromise = undefined;
		}
	}

	async #refreshSessionInner() {
		const session = this.session;

		if (!session || !session.refreshJwt) {
			return;
		}

		// we can't use `rpc.call` here because we've monkeypatched it to handle
		// expired token, as this is part of the expired token handling, we must
		// manually craft an rpc request

		// send the refresh request
		const url = new URL(`/xrpc/com.atproto.server.refreshSession`, session.pdsUri || this.serviceUri);

		const res = await this.fetch(
			url.toString(),
			'POST',
			{
				authorization: `Bearer ${session.refreshJwt}`,
			},
			undefined,
			undefined,
		);

		if (isErrorResponse(res.body, ['ExpiredToken', 'InvalidToken'])) {
			// failed due to a bad refresh token
			this.#resetSession();
			this.emit('sessionExpired');
		} else if (httpResponseCodeToEnum(res.status) === ResponseType.Success) {
			// succeeded, update the session
			this.#updateSession(res.body as ComAtprotoServerRefreshSession.Output);
			this.emit('sessionUpdate', this.session!);
		}
	}

	#resetSession(existing?: AtpSessionData) {
		this.session = existing;
		this.rpc.serviceUri = (existing && existing.pdsUri) || this.serviceUri;
	}

	#updateSession(raw: ComAtprotoServerCreateSession.Output) {
		const didDoc = raw.didDoc as DidDocument | undefined;

		let pdsUri: string | undefined;
		if (didDoc) {
			pdsUri = getPdsEndpoint(didDoc);
		}

		this.rpc.serviceUri = pdsUri || this.serviceUri;

		return (this.session = {
			accessJwt: raw.accessJwt,
			refreshJwt: raw.refreshJwt,
			handle: raw.handle,
			did: raw.did,
			pdsUri: pdsUri,
			email: raw.email,
			emailConfirmed: raw.emailConfirmed,
		});
	}
}

export const getPdsEndpoint = (doc: DidDocument) => {
	return getServiceEndpoint(doc, '#atproto_pds', 'AtprotoPersonalDataServer');
};

export const getServiceEndpoint = (doc: DidDocument, serviceId: string, serviceType: string) => {
	const did = doc.id;

	const didServiceId = did + serviceId;
	const found = doc.service?.find((service) => service.id === serviceId || service.id === didServiceId);

	if (!found || found.type !== serviceType || typeof found.serviceEndpoint !== 'string') {
		return undefined;
	}

	return validateUrl(found.serviceEndpoint);
};

const validateUrl = (urlStr: string): string | undefined => {
	let url;
	try {
		url = new URL(urlStr);
	} catch {
		return undefined;
	}

	const proto = url.protocol;

	if (url.hostname && (proto === 'http:' || proto === 'https:')) {
		return urlStr;
	}
};

export interface AtpLoginOptions {
	identifier: string;
	password: string;
}

export interface DidDocument {
	id: string;
	alsoKnownAs?: string[];
	verificationMethod?: Array<{
		id: string;
		type: string;
		controller: string;
		publicKeyMultibase?: string;
	}>;
	service?: Array<{
		id: string;
		type: string;
		serviceEndpoint: string | Record<string, unknown>;
	}>;
}
