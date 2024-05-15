import type { BskyXRPC } from '@mary/bluesky-client';
import { nanoid } from 'nanoid/non-secure';

import type { ChatBskyConvoGetLog } from '~/api/atp-schema';

import { EventEmitter } from '../events';

type ConvoEvents = ChatBskyConvoGetLog.Output['logs'];

export type FirehoseErrorKind = 'unknown' | 'init_failure' | 'poll_failure';

export interface FirehoseError {
	kind: FirehoseErrorKind;
	exception?: unknown;
	retry: () => void;
}

export type ChatFirehoseEvents = {
	connect: () => void;
	error: (err: FirehoseError) => void;
	log: (buckets: Map<string, ConvoEvents>) => void;
	[key: `log:${string}`]: (events: ConvoEvents) => void;
};

export class ChatFirehose extends EventEmitter<ChatFirehoseEvents> {
	rpc: BskyXRPC;

	#status: FirehoseStatus = FirehoseStatus.INITIALIZING;
	#latestRev: string | undefined;

	#pollId: number | undefined;
	#pollImmediately = true;
	#isPolling = false;
	#requestedPollIntervals: Map<string, number> = new Map();

	#isBackgrounding = false;

	constructor(rpc: BskyXRPC) {
		super();

		this.rpc = rpc;

		this.#init();
	}

	/// Public APIs
	init() {
		this.#dispatch({ type: FirehoseAction.INITIALIZE });
	}

	background() {
		this.#isBackgrounding = true;
		this.#dispatch({ type: FirehoseAction.BACKGROUND });
	}

	resume() {
		this.#isBackgrounding = false;
		this.#dispatch({ type: FirehoseAction.RESUME });
	}

	requestPollInterval(interval: number): () => void {
		const id = nanoid();

		this.#requestedPollIntervals.set(id, interval);
		this.#dispatch({ type: FirehoseAction.UPDATE_POLL });

		return () => {
			this.#requestedPollIntervals.delete(id);
			this.#dispatch({ type: FirehoseAction.UPDATE_POLL });
		};
	}

	destroy() {
		this.#status = FirehoseStatus.DESTROYED;
		this.#stopPolling();
	}

	/// Dispatcher
	#dispatch(action: BusDispatch): void {
		switch (this.#status) {
			case FirehoseStatus.UNINITIALIZED: {
				switch (action.type) {
					case FirehoseAction.INITIALIZE: {
						this.#status = FirehoseStatus.INITIALIZING;

						this.#init();
						break;
					}
				}

				break;
			}
			case FirehoseStatus.INITIALIZING: {
				switch (action.type) {
					case FirehoseAction.READY: {
						this.#status = !this.#isBackgrounding ? FirehoseStatus.READY : FirehoseStatus.BACKGROUNDED;
						this.#startPolling(true);

						this.emit('connect');
						break;
					}
					case FirehoseAction.ERROR: {
						this.#status = FirehoseStatus.ERROR;

						this.emit('error', action.data);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.READY: {
				switch (action.type) {
					case FirehoseAction.BACKGROUND: {
						this.#status = FirehoseStatus.BACKGROUNDED;
						this.#startPolling();

						break;
					}
					case FirehoseAction.UPDATE_POLL: {
						this.#startPolling();

						break;
					}
					case FirehoseAction.ERROR: {
						this.#status = FirehoseStatus.ERROR;
						this.#stopPolling();

						this.emit('error', action.data);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.BACKGROUNDED: {
				switch (action.type) {
					case FirehoseAction.RESUME: {
						this.#status = FirehoseStatus.READY;
						this.#startPolling();

						break;
					}
					case FirehoseAction.UPDATE_POLL: {
						this.#startPolling();

						break;
					}
					case FirehoseAction.ERROR: {
						this.#status = FirehoseStatus.ERROR;
						this.#stopPolling();

						this.emit('error', action.data);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.ERROR: {
				switch (action.type) {
					case FirehoseAction.RESUME: {
						this.#status = FirehoseStatus.INITIALIZING;
						this.#latestRev = undefined;

						this.#init();
						break;
					}
				}

				break;
			}
		}
	}

	/// Init code
	async #init() {
		try {
			const response = await this.rpc.get('chat.bsky.convo.listConvos', {
				params: { limit: 1 },
			});

			const convos = response.data.convos;
			let latestRev = this.#latestRev;

			for (const convo of convos) {
				const rev = convo.rev;

				if (latestRev === undefined || rev > latestRev) {
					latestRev = rev;
				}
			}

			this.#latestRev = latestRev;

			this.#dispatch({ type: FirehoseAction.READY });
		} catch (err) {
			this.#dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'init_failure',
					exception: err,
					retry: () => this.#dispatch({ type: FirehoseAction.RESUME }),
				},
			});
		}
	}

	/// Polling code
	#stopPolling(): void {
		const pollId = this.#pollId;

		if (pollId !== undefined) {
			clearTimeout(pollId);
			this.#pollId = undefined;
		}
	}

	#startPolling(init = false): void {
		this.#stopPolling();

		let status = this.#status;
		let pollInterval = 30_000;

		if (status !== FirehoseStatus.READY && status !== FirehoseStatus.BACKGROUNDED) {
			return;
		}

		if (status === FirehoseStatus.READY) {
			pollInterval = Math.min(pollInterval, ...this.#requestedPollIntervals.values());

			// Ratelimit immediate polling
			if (this.#pollImmediately && !this.#isPolling) {
				this.#pollImmediately = false;

				// Don't actually poll if we just initialized
				if (!init) {
					this.#poll();
				}

				setTimeout(() => (this.#pollImmediately = true), 10_000);
			}
		}

		this.#pollId = setInterval(() => {
			if (this.#isPolling) {
				return;
			}

			this.#poll();
		}, pollInterval);
	}

	async #poll() {
		if (this.#isPolling) {
			return;
		}

		this.#isPolling = true;

		try {
			const buckets = new Map<string, ConvoEvents>();

			let cursor = this.#latestRev;

			do {
				const response = await this.rpc.get('chat.bsky.convo.getLog', {
					params: {
						cursor: cursor,
					},
				});

				const events = response.data.logs;

				for (const ev of events) {
					const convoId = ev.convoId;

					if (buckets.has(convoId)) {
						buckets.get(convoId)!.push(ev);
					} else {
						buckets.set(convoId, [ev]);
					}
				}

				cursor = response.data.cursor;

				if (events.length === 0) {
					break;
				}
			} while (true);

			this.#latestRev = cursor;

			if (buckets.size !== 0) {
				// there shouldn't be any need to try-catch these emits, should it?
				this.emit(`log`, buckets);

				for (const [convoId, batch] of buckets) {
					this.emit(`log:${convoId}`, batch);
				}
			}
		} catch (e) {
			this.#dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'poll_failure',
					exception: e,
					retry: () => this.#dispatch({ type: FirehoseAction.RESUME }),
				},
			});
		} finally {
			this.#isPolling = false;
		}
	}
}

const enum FirehoseStatus {
	UNINITIALIZED,
	INITIALIZING,
	READY,
	ERROR,
	BACKGROUNDED,
	DESTROYED,
}

const enum FirehoseAction {
	INITIALIZE,
	READY,
	ERROR,
	BACKGROUND,
	RESUME,
	UPDATE_POLL,
}

type BusDispatch =
	| { type: FirehoseAction.INITIALIZE }
	| { type: FirehoseAction.READY }
	| { type: FirehoseAction.BACKGROUND }
	| { type: FirehoseAction.RESUME }
	| { type: FirehoseAction.ERROR; data: FirehoseError }
	| { type: FirehoseAction.UPDATE_POLL };
