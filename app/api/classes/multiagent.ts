import { batch, createEffect, createRoot } from 'solid-js';

import {
	type AtpAccessJwt,
	type AtpLoginOptions,
	type AtpSessionData,
	Agent,
} from '@externdefs/bluesky-client/agent';
import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { decodeJwt } from '@externdefs/bluesky-client/jwt';

import { createReactiveLocalStorage } from '~/utils/storage.ts';

export interface MultiagentLoginOptions extends AtpLoginOptions {
	service: string;
}

export interface MultiagentProfileData {
	displayName?: string;
	// handle: string;
	avatar?: string;
	indexedAt?: string;
}

export interface MultiagentAccountData {
	readonly did: DID;
	service: string;
	session: AtpSessionData;
	isAppPassword?: boolean;
	profile?: MultiagentProfileData;
}

interface MultiagentStorage {
	$version: 1;
	active: DID | undefined;
	accounts: MultiagentAccountData[];
}

interface AgentInstance {
	agent: Promise<Agent>;
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

	#agents: Record<DID, AgentInstance> = {};

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
	set active(next: DID | undefined) {
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
	async login({ service, identifier, password }: MultiagentLoginOptions): Promise<DID> {
		const { agent, cleanup } = this.#createAgent(service);

		try {
			await agent.login({ identifier, password });

			const session = agent.session!;
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
			this.#agents[did] = { agent: Promise.resolve(agent), cleanup: cleanup };
			return did;
		} catch (err) {
			throw new MultiagentError(`Failed to login`, { cause: err });
		}
	}

	/**
	 * Log out from account
	 */
	logout(did: DID): void {
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
	connect(did: DID): Promise<Agent> {
		if (did in this.#agents) {
			return this.#agents[did].agent;
		}

		const $accounts = this.store.accounts;
		const data = $accounts.find((acc) => acc.did === did);

		if (!data) {
			return Promise.reject(new MultiagentError(`Invalid account`));
		}

		const { agent, cleanup } = this.#createAgent(data.service);

		const promise = new Promise<Agent>((resolve, reject) => {
			agent.resumeSession(data.session).then(
				() => {
					resolve(agent);
				},
				(err) => {
					cleanup();

					delete this.#agents[did];
					reject(new MultiagentError(`Failed to resume session`, { cause: err }));
				},
			);
		});

		this.#agents[did] = { agent: promise, cleanup: cleanup };
		return promise;
	}

	#createAgent(serviceUri: string) {
		const $accounts = this.store.accounts!;
		const agent = new Agent({ serviceUri: serviceUri });

		let ignore = false;

		agent.on('sessionUpdate', (session) => {
			const did = session!.did;
			const existing = $accounts.find((acc) => acc.did === did);

			if (existing) {
				ignore = true;

				batch(() => {
					Object.assign(existing.session, session);
				});

				ignore = false;
			}
		});

		return {
			agent: agent,
			cleanup: createRoot((dispose) => {
				createEffect(() => {
					const actual = agent.session;

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
