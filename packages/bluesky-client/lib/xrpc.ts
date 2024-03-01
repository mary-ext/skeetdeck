import {
	type Headers,
	type QueryParams,
	constructMethodCallHeaders,
	constructMethodCallUri,
	encodeMethodCallBody,
	httpResponseBodyParse,
	httpResponseCodeToEnum,
	ResponseType,
	XRPCError,
	XRPCResponse,
} from './xrpc-utils.js';

/** Returned response */
export interface FetchHandlerResponse {
	status: number;
	headers: Headers;
	body: any;
}

/** Response body from a thrown query/procedure */
export interface ErrorResponseBody {
	error?: string;
	message?: string;
}

/**
 * Checks if the response body is an error
 * @param value Raw response body
 * @param names Pass this if you're only interested in select errors
 * @returns Whether the `value` is an error response
 */
export const isErrorResponse = (value: any, names?: string[]): value is ErrorResponseBody => {
	if (!value) {
		return false;
	}

	const errType = typeof value.error;
	const msgType = typeof value.message;

	return (
		(errType === 'undefined' || errType === 'string') &&
		(msgType === 'undefined' || msgType === 'string') &&
		(!names || names.includes(value.error))
	);
};

export type FetchHandler = (
	httpUri: string,
	httpMethod: string,
	httpHeaders: Headers,
	httpReqBody: unknown,
	signal: AbortSignal | undefined,
) => Promise<FetchHandlerResponse>;

export const defaultFetchHandler: FetchHandler = async (
	httpUri,
	httpMethod,
	httpHeaders,
	httpReqBody,
	signal,
) => {
	// The duplex field is now required for streaming bodies, but not yet reflected
	// anywhere in docs or types. See whatwg/fetch#1438, nodejs/node#46221.
	const reqInit: RequestInit & { duplex: string } = {
		signal: signal,
		method: httpMethod,
		headers: httpHeaders,
		body: encodeMethodCallBody(httpHeaders, httpReqBody),
		duplex: 'half',
	};

	const res = await fetch(httpUri, reqInit);
	const resBody = await res.arrayBuffer();

	return {
		status: res.status,
		headers: Object.fromEntries(res.headers.entries()),
		body: httpResponseBodyParse(res.headers.get('content-type'), resBody),
	};
};

interface BaseRPCOptions {
	encoding?: string;
	headers?: Headers;
	signal?: AbortSignal;
}

export type RPCOptions<T> = BaseRPCOptions &
	(T extends { params: any } ? { params: T['params'] } : {}) &
	(T extends { input: any } ? { data: T['input'] } : {});

export type OutputOf<T> = T extends { output: any } ? T['output'] : never;

/**
 * The core functionality that talks to XRPC-based endpoints
 * @typeParam Queries Interface containing available query endpoints
 * @typeParam Procedures Interface containing available procedure endpoints
 */
export class XRPC<Queries, Procedures> {
	constructor(
		/** The service it should connect to */
		public serviceUri: string,
		/**
		 * The fetch handler it should use, the default fetch handler uses fetch API, but you can
		 * easily replace this with something else for cases like mocking.
		 */
		public fetch: FetchHandler = defaultFetchHandler,
	) {}

	/**
	 * Makes a query (GET) request
	 * @param nsid Namespace ID of a query endpoint
	 * @param options Options to include like parameters
	 * @returns The response of the request
	 */
	get<K extends keyof Queries>(
		nsid: K,
		options: RPCOptions<Queries[K]>,
	): Promise<XRPCResponse<OutputOf<Queries[K]>>> {
		return this.#call({ type: 'get', method: nsid as any, ...options });
	}

	/**
	 * Makes a procedure (POST) request
	 * @param nsid Namespace ID of a procedure endpoint
	 * @param options Options to include like input body or parameters
	 * @returns The response of the request
	 */
	call<K extends keyof Procedures>(
		nsid: K,
		options: RPCOptions<Procedures[K]>,
	): Promise<XRPCResponse<OutputOf<Procedures[K]>>> {
		return this.#call({ type: 'post', method: nsid as any, ...options });
	}

	async #call(options: PrivCallOptions) {
		const { type, method, params, data, encoding, headers = {}, signal } = options;

		const httpUri = constructMethodCallUri(method, this.serviceUri, params);
		const httpHeaders = constructMethodCallHeaders(headers, type, data, encoding);

		const res = await this.fetch(httpUri, type, httpHeaders, data, signal);

		const resCode = httpResponseCodeToEnum(res.status);

		if (resCode === ResponseType.Success) {
			return new XRPCResponse(res.body, res.headers);
		} else {
			if (res.body && isErrorResponse(res.body)) {
				throw new XRPCError(resCode, res.body.error, res.body.message);
			} else {
				throw new XRPCError(resCode);
			}
		}
	}
}

interface PrivCallOptions {
	type: 'get' | 'post';
	method: string;

	params?: QueryParams;
	data?: unknown;

	encoding?: string;
	headers?: Headers;
	signal?: AbortSignal;
}
