import type { BskyXRPC } from '@mary/bluesky-client';
import { nanoid } from 'nanoid/non-secure';

import type { ChatBskyConvoGetLog } from '~/api/atp-schema';

import { EventEmitter } from '../events';

function debug(msg: string) {
	if (import.meta.env.DEV) {
		console.log(`[chat-firehose] ${msg}`);
	}
}

type UnwrapArray<T> = T extends (infer V)[] ? V : never;

export type ConvoEvent = UnwrapArray<ChatBskyConvoGetLog.Output['logs']>;

export type FirehoseErrorKind = 'unknown' | 'init_failure' | 'poll_failure';

export interface FirehoseError {
	kind: FirehoseErrorKind;
	exception?: unknown;
	retry: () => void;
}

export type ChatFirehoseEvents = {
	connect: () => void;
	error: (err: FirehoseError) => void;
	event: (event: ConvoEvent) => void;
};

export type ChatFirehose = ReturnType<typeof createChatFirehose>;

export const createChatFirehose = (rpc: BskyXRPC) => {
	let status = FirehoseStatus.UNINITIALIZED;
	let latestRev: string | undefined;

	let pollId: number | undefined;
	let pollImmediately = true;
	let isPolling = false;
	let requestedPollIntervals: Map<string, number> = new Map();

	let isBackgrounding = false;

	const emitter = new EventEmitter<ChatFirehoseEvents>();

	const dispatch = (action: BusDispatch): void => {
		switch (status) {
			case FirehoseStatus.UNINITIALIZED: {
				switch (action.type) {
					case FirehoseAction.INITIALIZE: {
						status = FirehoseStatus.INITIALIZING;

						init();
						debug(`transition: UNINITIALIZED -> INITIALIZING`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.INITIALIZING: {
				switch (action.type) {
					case FirehoseAction.READY: {
						status = !isBackgrounding ? FirehoseStatus.READY : FirehoseStatus.BACKGROUNDED;
						startPolling(true);

						emitter.emit('connect');
						debug(`transition: INITIALIZING -> ${!isBackgrounding ? `READY` : `BACKGROUNDED`}`);
						break;
					}
					case FirehoseAction.ERROR: {
						status = FirehoseStatus.ERROR;

						emitter.emit('error', action.data);
						debug(`transition: INITIALIZING -> ERROR`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.READY: {
				switch (action.type) {
					case FirehoseAction.BACKGROUND: {
						status = FirehoseStatus.BACKGROUNDED;
						startPolling();

						debug(`transition: READY -> BACKGROUNDED`);
						break;
					}
					case FirehoseAction.UPDATE_POLL: {
						startPolling();

						break;
					}
					case FirehoseAction.ERROR: {
						status = FirehoseStatus.ERROR;
						stopPolling();

						emitter.emit('error', action.data);
						debug(`transition: READY -> ERROR`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.BACKGROUNDED: {
				switch (action.type) {
					case FirehoseAction.RESUME: {
						status = FirehoseStatus.READY;
						startPolling();

						debug(`transition: BACKGROUNDED -> READY`);
						break;
					}
					case FirehoseAction.UPDATE_POLL: {
						startPolling();

						break;
					}
					case FirehoseAction.ERROR: {
						status = FirehoseStatus.ERROR;
						stopPolling();

						emitter.emit('error', action.data);
						debug(`transition: BACKGROUNDED -> ERROR`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.ERROR: {
				switch (action.type) {
					case FirehoseAction.RESUME: {
						status = FirehoseStatus.INITIALIZING;
						latestRev = action.rev;

						init();
						debug(`transition: ERROR -> INITIALIZING`);
						break;
					}
				}

				break;
			}
		}
	};

	const init = async (): Promise<void> => {
		try {
			const response = await rpc.get('chat.bsky.convo.listConvos', {
				params: { limit: 1 },
			});

			const convos = response.data.convos;

			for (const convo of convos) {
				const rev = convo.rev;

				if (latestRev === undefined || rev > latestRev) {
					latestRev = rev;
				}
			}

			dispatch({ type: FirehoseAction.READY });
		} catch (err) {
			dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'init_failure',
					exception: err,
					retry: () => dispatch({ type: FirehoseAction.RESUME }),
				},
			});
		}
	};

	const stopPolling = (): void => {
		if (pollId !== undefined) {
			debug(`removing polling`);

			clearTimeout(pollId);
			pollId = undefined;
		}
	};

	const startPolling = (init = false): void => {
		stopPolling();

		let pollInterval = 30_000;

		if (status !== FirehoseStatus.READY && status !== FirehoseStatus.BACKGROUNDED) {
			return;
		}

		if (status === FirehoseStatus.READY) {
			pollInterval = Math.min(pollInterval, ...requestedPollIntervals.values());

			// Ratelimit immediate polling
			if (pollImmediately && !isPolling) {
				pollImmediately = false;

				// Don't actually poll if we just initialized
				if (!init) {
					poll();
				}

				setTimeout(() => (pollImmediately = true), 10_000);
			}
		}

		debug(`setting up polling for ${pollInterval} ms`);

		pollId = setInterval(() => {
			if (isPolling) {
				return;
			}

			poll();
		}, pollInterval);
	};

	const poll = async (): Promise<void> => {
		if (isPolling) {
			return;
		}

		isPolling = true;

		let cursor = latestRev;

		try {
			const { data } = await rpc.get('chat.bsky.convo.getLog', {
				params: {
					cursor: cursor,
				},
			});

			const events = data.logs;

			for (let idx = 0, len = events.length; idx < len; idx++) {
				const event = events[idx];
				emitter.emit('event', event);
			}
		} catch (e) {
			dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'poll_failure',
					exception: e,
					retry: () => dispatch({ type: FirehoseAction.RESUME, rev: cursor }),
				},
			});
		} finally {
			isPolling = false;
		}
	};

	return {
		emitter,
		init(): void {
			dispatch({ type: FirehoseAction.INITIALIZE });
		},
		background(): void {
			isBackgrounding = true;
			dispatch({ type: FirehoseAction.BACKGROUND });
		},
		resume(): void {
			isBackgrounding = false;
			dispatch({ type: FirehoseAction.RESUME });
		},
		requestPollInterval(interval: number): () => void {
			const id = nanoid();

			requestedPollIntervals.set(id, interval);
			dispatch({ type: FirehoseAction.UPDATE_POLL });

			return () => {
				requestedPollIntervals.delete(id);
				dispatch({ type: FirehoseAction.UPDATE_POLL });
			};
		},
		destroy() {
			status = FirehoseStatus.DESTROYED;
			stopPolling();

			debug(`destroyed`);
		},
	};
};

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
	| { type: FirehoseAction.RESUME; rev?: string }
	| { type: FirehoseAction.ERROR; data: FirehoseError }
	| { type: FirehoseAction.UPDATE_POLL };
