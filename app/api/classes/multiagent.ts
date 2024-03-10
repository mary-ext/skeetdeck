import { batch, createEffect, createRoot } from 'solid-js';
import { unwrap } from 'solid-js/store';

import {
	type AtpAccessJwt,
	type AtpSessionData,
	type AuthLoginOptions,
	BskyAuth,
	BskyXRPC,
} from '@externdefs/bluesky-client';
import { decodeJwt } from '@externdefs/bluesky-client/utils/jwt';

import type { At } from '../atp-schema';

import { createReactiveLocalStorage } from '~/utils/storage';

export interface MultiagentLoginOptions extends AuthLoginOptions {
	service: string;
}

export interface MultiagentProfileData {
	displayName?: string;
	// handle: string;
	avatar?: string;
	indexedAt?: string;
}

export interface MultiagentAccountData {
	readonly did: At.DID;
	service: string;
	session: AtpSessionData;
	isAppPassword?: boolean;
	profile?: MultiagentProfileData;
}

interface MultiagentStorage {
	$version: 1;
	active: At.DID | undefined;
	accounts: MultiagentAccountData[];
}

export interface AgentInstance {
	rpc: BskyXRPC;
	auth: BskyAuth;
}

interface StoredAgent {
	instance: Promise<AgentInstance>;
	cleanup: () => void;
}

export class MultiagentError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'MultiagentError';
	}
}

export class Multiagent {
	store: MultiagentStorage;

	#agents: Record<At.DID, StoredAgent> = {};

	constructor(name: string) {
		const store = createReactiveLocalStorage<MultiagentStorage>(name, (version, prev) => {
			if (version === 0) {
				return {
					$version: 1,
					active: undefined,
					accounts: [],
				};
			}

			return prev;
		});

		this.store = store;
	}

	/**
	 * A record of registered accounts
	 */
	get accounts() {
		return this.store.accounts;
	}

	/**
	 * Active UID set as default
	 */
	get active() {
		let value = this.store.active;

		if (value === undefined) {
			const accounts = this.accounts;

			if (accounts.length > 0) {
				value = this.store.active = accounts[0].did;
			}
		}

		return value;
	}
	set active(next: At.DID | undefined) {
		batch(() => {
			this.store.active = next;

			if (next) {
				const accounts = this.store.accounts.slice();
				accounts.sort((a, _b) => (a.did === next ? -1 : 1));

				this.store.accounts = accounts;
			}
		});
	}

	/**
	 * Login with a new account
	 */
	async login({ service, identifier, password }: MultiagentLoginOptions): Promise<At.DID> {
		const { auth, rpc, cleanup } = this.#createAgent(service);

		try {
			await auth.login({ identifier, password });

			const session = auth.session!;
			const did = session.did;

			const sessionJwt = decodeJwt(session.accessJwt) as AtpAccessJwt;
			const isAppPassword = sessionJwt.scope === 'com.atproto.appPass';

			batch(() => {
				const $accounts = this.accounts!;
				const existing = $accounts.find((acc) => acc.did === did);

				if (existing) {
					existing.service = service;
					existing.session = session;
					existing.isAppPassword = isAppPassword;
				} else {
					$accounts.push({
						did: did,
						service: service,
						session: session,
						isAppPassword: isAppPassword,
					});
				}
			});

			this.#agents[did]?.cleanup();
			this.#agents[did] = { instance: Promise.resolve({ auth, rpc }), cleanup: cleanup };
			return did;
		} catch (err) {
			throw new MultiagentError(`LOGIN_FAILURE`, { cause: err });
		}
	}

	/**
	 * Log out from account
	 */
	logout(did: At.DID): void {
		const $accounts = this.accounts;
		const index = $accounts.findIndex((acc) => acc.did === did);

		if (index !== -1) {
			$accounts.splice(index, 1);

			delete this.#agents[did];

			if (this.active === did) {
				this.active = undefined;
			}
		}
	}

	/**
	 * Retrieve an agent associated with an account
	 */
	connect(did: At.DID): Promise<AgentInstance> {
		if (did in this.#agents) {
			return this.#agents[did].instance;
		}

		const $accounts = this.store.accounts;
		const data = $accounts.find((acc) => acc.did === did);

		if (!data) {
			return Promise.reject(new MultiagentError(`INVALID_ACCOUNT`));
		}

		const { rpc, auth, cleanup } = this.#createAgent(data.service);

		const promise = new Promise<AgentInstance>((resolve, reject) => {
			auth.resume(unwrap(data.session)).then(
				() => {
					resolve({ auth, rpc });
				},
				(err) => {
					cleanup();

					delete this.#agents[did];
					reject(new MultiagentError(`RESUME_FAILURE`, { cause: err }));
				},
			);
		});

		this.#agents[did] = { instance: promise, cleanup: cleanup };
		return promise;
	}

	#createAgent(serviceUri: string) {
		let ignore = false;

		const $accounts = this.store.accounts!;

		const rpc = new BskyXRPC({ service: serviceUri });
		const auth = new BskyAuth(rpc, {
			onRefresh(session) {
				const did = session!.did;
				const existing = $accounts.find((acc) => acc.did === did);

				if (existing) {
					ignore = true;
					batch(() => Object.assign(existing.session, session));
					ignore = false;
				}
			},
		});

		return {
			rpc: rpc,
			auth: auth,
			cleanup: createRoot((dispose) => {
				createEffect(() => {
					const actual = auth.session;

					const did = actual?.did;
					const existing = $accounts.find((acc) => did && acc.did === did);

					if (!ignore && existing) {
						const expected = existing.session;

						if (actual!.accessJwt !== expected.accessJwt || actual!.refreshJwt !== expected.refreshJwt) {
							actual!.accessJwt = expected.accessJwt;
							actual!.refreshJwt = expected.refreshJwt;
						}
					}
				});

				return dispose;
			}),
		};
	}
}
