import { nanoid } from 'nanoid/non-secure';
import { batch, createSignal, untrack } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';
import { EventEmitter } from '@mary/events';

import type { ChatBskyConvoGetLog } from '~/api/atp-schema';

function debug(msg: string) {
	if (import.meta.env.DEV) {
		console.log(`%c[chat-firehose]%c ${msg}`, `color: #ffd700`, ``);
	}
}

type UnwrapArray<T> = T extends (infer V)[] ? V : never;

export type ConvoEvent = UnwrapArray<ChatBskyConvoGetLog.Output['logs']>;

export type FirehoseErrorKind = 'unknown' | 'init_failure' | 'poll_failure';

export interface FirehoseError {
	kind: FirehoseErrorKind;
	exception?: unknown;
}

export type ChatFirehoseEvents = {
	event: (event: ConvoEvent) => void;
	read: (channelId: string, messageId: string) => void;
};

export type ChatFirehose = ReturnType<typeof createChatFirehose>;

export const createChatFirehose = (rpc: BskyXRPC) => {
	const [status, setStatus] = createSignal(FirehoseStatus.IDLE);
	const [error, setError] = createSignal<FirehoseError>();

	let initialRevRetrieved = false;
	let latestRev: string | undefined;

	let pollId: number | undefined;
	let pollImmediately = true;
	let isPolling = false;
	let lastPollInterval: number | undefined;
	let requestedPollIntervals: Map<string, number> = new Map();

	let isBackgrounding = false;

	const emitter = new EventEmitter<ChatFirehoseEvents>();

	const dispatch = (action: BusDispatch): void => {
		switch (untrack(status)) {
			case FirehoseStatus.IDLE: {
				switch (action.type) {
					case FirehoseAction.CONNECT: {
						setStatus(FirehoseStatus.INITIALIZING);

						init();

						debug(`transition: IDLE -> INITIALIZING`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.INITIALIZING: {
				switch (action.type) {
					case FirehoseAction.CONNECTED: {
						setStatus(FirehoseStatus.READY);
						startPolling(true);

						debug(`transition: INITIALIZING -> ${!isBackgrounding ? `READY` : `BACKGROUNDED`}`);
						break;
					}
					case FirehoseAction.ERROR: {
						batch(() => {
							setStatus(FirehoseStatus.ERROR);
							setError(action.data);
						});

						debug(`transition: INITIALIZING -> ERROR`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.READY: {
				switch (action.type) {
					case FirehoseAction.BACKGROUND: {
						if (!isBackgrounding) {
							debug(`isBackgrounding = true`);

							isBackgrounding = true;
							startPolling(true);
						}

						break;
					}
					case FirehoseAction.RESUME: {
						if (isBackgrounding) {
							debug(`isBackgrounding = false`);

							isBackgrounding = false;
							startPolling();
						}

						break;
					}
					case FirehoseAction.UPDATE_POLL: {
						startPolling();
						break;
					}
					case FirehoseAction.POLL_NOW: {
						poll();
						break;
					}
					case FirehoseAction.ERROR: {
						batch(() => {
							setStatus(FirehoseStatus.ERROR);
							setError(action.data);
						});

						stopPolling();

						debug(`transition: READY -> ERROR`);
						break;
					}
				}

				break;
			}
			case FirehoseStatus.ERROR: {
				switch (action.type) {
					case FirehoseAction.RESUME: {
						isBackgrounding = false;

						batch(() => {
							setStatus(FirehoseStatus.INITIALIZING);
							setError(undefined);
						});

						if (initialRevRetrieved) {
							poll().then(() => {
								if (untrack(status) === FirehoseStatus.INITIALIZING) {
									dispatch({ type: FirehoseAction.CONNECTED });
								}
							});
						} else {
							init();
						}

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

			latestRev = undefined;
			initialRevRetrieved = true;

			for (const convo of convos) {
				const rev = convo.rev;

				if (latestRev === undefined || rev > latestRev) {
					latestRev = rev;
				}
			}

			dispatch({ type: FirehoseAction.CONNECTED });
		} catch (err) {
			dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'init_failure',
					exception: err,
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
		if (untrack(status) !== FirehoseStatus.READY) {
			return;
		}

		let pollInterval = 30_000;

		if (!isBackgrounding) {
			pollInterval = Math.min(pollInterval, ...requestedPollIntervals.values());
		}

		if (pollImmediately && !isPolling) {
			pollImmediately = false;

			// Don't actually poll if we just initialized
			if (!init) {
				debug(`immediate polling requested`);
				poll();
			}

			setTimeout(() => (pollImmediately = true), 10_000);
		}

		if (pollId !== undefined && lastPollInterval === pollInterval) {
			return;
		}

		lastPollInterval = pollInterval;
		stopPolling();

		debug(`setting up polling for ${pollInterval} ms`);

		pollId = setInterval(poll, pollInterval);
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
			latestRev = cursor = data.cursor;

			if (events.length !== 0) {
				debug(`received ${events.length} events`);
			}

			batch(() => {
				for (let idx = 0, len = events.length; idx < len; idx++) {
					const event = events[idx];
					emitter.emit('event', event);
				}
			});
		} catch (e) {
			dispatch({
				type: FirehoseAction.ERROR,
				data: {
					kind: 'poll_failure',
					exception: e,
				},
			});
		} finally {
			isPolling = false;
		}
	};

	return {
		status,
		error,
		emitter,

		init(): void {
			dispatch({ type: FirehoseAction.CONNECT });
		},
		background(): void {
			dispatch({ type: FirehoseAction.BACKGROUND });
		},
		resume(): void {
			dispatch({ type: FirehoseAction.RESUME });
		},
		poll(): void {
			dispatch({ type: FirehoseAction.POLL_NOW });
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
			setStatus(FirehoseStatus.DESTROYED);
			stopPolling();

			debug(`destroyed`);
		},
	};
};

export const enum FirehoseStatus {
	IDLE,
	RECONNECT,
	INITIALIZING,
	READY,
	ERROR,
	DESTROYED,
}

const enum FirehoseAction {
	CONNECT,
	CONNECTED,
	ERROR,
	BACKGROUND,
	RESUME,
	UPDATE_POLL,
	POLL_NOW,
}

type BusDispatch =
	| { type: FirehoseAction.CONNECT }
	| { type: FirehoseAction.CONNECTED }
	| { type: FirehoseAction.BACKGROUND }
	| { type: FirehoseAction.RESUME; rev?: string }
	| { type: FirehoseAction.ERROR; data: FirehoseError }
	| { type: FirehoseAction.UPDATE_POLL }
	| { type: FirehoseAction.POLL_NOW };
