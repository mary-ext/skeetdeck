import { batch, createRoot, createSignal, getOwner, onCleanup, runWithOwner } from 'solid-js';

import type { XRPC } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';

import { SignalizedConvo, mergeConvo } from '~/api/stores/convo';

import { makeAbortable } from '~/utils/hooks';

import type { ChatFirehose, ConvoEvent } from './firehose';

type ChannelEvent = ConvoEvent | MarkReadEvent;

export interface ChannelListingOptions {
	did: At.DID;
	rpc: XRPC;
	firehose: ChatFirehose;
	fetchLimit?: number;
}

export const createChannelListing = ({ did, rpc, firehose, fetchLimit = 20 }: ChannelListingOptions) => {
	return createRoot((destroy) => {
		let init = false;

		const owner = getOwner();
		const [abortable] = makeAbortable();

		/** Loaded channels */
		const [channels, setChannels] = createSignal<SignalizedConvo[]>([]);

		/** Cursor returned from channel listing, `null` if we've reached the end */
		const [cursor, setCursor] = createSignal<string | null>();

		/** Current fetching state */
		const [fetching, setFetching] = createSignal<FetchState>();
		/** Whether the last fetch has failed */
		const [failed, setFailed] = createSignal<FailureState>();

		/** Whether the list has new conversations */
		const [hasNew, setHasNew] = createSignal(false);

		/** Firehose events we haven't processed because we're currently fetching */
		let pendingEvents: ChannelEvent[] | undefined;

		const processFirehoseEvents = (channels: SignalizedConvo[], events: ChannelEvent[]) => {
			const removedChannels = new Map<string, SignalizedConvo>();
			const addedChannels: string[] = [];

			let last: { convo: SignalizedConvo; index: number } | undefined;

			for (let idx = 0, len = events.length; idx < len; idx++) {
				const event = events[idx];

				const type = event.$type;
				const channelId = event.convoId;

				let convo: SignalizedConvo | undefined;

				if (last === undefined || last.convo.id !== channelId) {
					const index = channels.findIndex((c) => c.id === channelId);

					if (index !== -1) {
						convo = channels[index];
						last = { convo, index };
					} else {
						// check if it's in the `removedChannels` array
						const removed = removedChannels.get(channelId);

						if (removed) {
							convo = removed;
							last = { convo, index: -1 };
						}
					}
				} else {
					convo = last.convo;
				}

				if (type === 'mark-read') {
					if (convo) {
						if (convo.lastMessage.peek()?.id === event.messageId) {
							convo.unread.value = false;
						}
					}
				} else if (type === 'chat.bsky.convo.defs#logLeaveConvo') {
					if (convo) {
						channels = channels.toSpliced(last!.index, 1);
						last!.index = -1;

						removedChannels.set(convo.id, convo);
					}
				} else if (type === 'chat.bsky.convo.defs#logCreateMessage') {
					if (convo) {
						convo.lastMessage.value = event.message;
						convo.unread.value = true;

						if (last!.index === -1) {
							removedChannels.delete(convo.id);

							channels = [convo, ...channels];
							last!.index = 0;
						} else if (last!.index !== 0) {
							channels = [convo, ...channels.toSpliced(last!.index, 1)];
							last!.index = 0;
						}
					} else {
						addedChannels.push(channelId);
					}
				} else if (type === 'chat.bsky.convo.defs#logDeleteMessage') {
					if (convo) {
						const convo = last!.convo;
						if (convo.lastMessage.peek()?.id === event.message.id) {
							convo.lastMessage.value = event.message;
						}
					}
				} else if (type === 'chat.bsky.convo.defs#logBeginConvo') {
					// do nothing for this one
				}
			}

			if (addedChannels.length !== 0) {
				setHasNew(true);
			}

			return channels;
		};

		const doInitialLoad = async (refresh = false) => {
			const signal = abortable();

			// Set fetching state
			setFetching(!refresh ? FetchState.INITIAL : FetchState.REFRESH);

			// Start deferring events from firehose
			pendingEvents = [];

			try {
				const { data } = await rpc.get('chat.bsky.convo.listConvos', {
					signal: signal,
					params: {
						limit: fetchLimit,
					},
				});

				const convos = data.convos;

				// Stop deferring firehose events
				const events = pendingEvents!;
				pendingEvents = undefined;

				batch(() => {
					const key = Date.now();

					// This is a fresh load, so set this to false
					setHasNew(false);

					// If we returned less than the limit, then we reached the end
					setCursor((convos.length >= fetchLimit && data.cursor) || null);

					// Process pending firehose events to completion
					const channels = convos.map((convo) => mergeConvo(did, convo, key));
					const processed = processFirehoseEvents(channels, events);

					setChannels(processed);

					// Reset fetching state
					setFetching();
				});
			} catch (err) {
				// Ignore error if we've been aborted
				if (signal.aborted) {
					return;
				}

				batch(() => {
					setFetching();
					setFailed({ cause: FailureCause.INITIAL, error: err });

					// Process deferred events
					if (pendingEvents !== undefined) {
						const events = pendingEvents;
						pendingEvents = undefined;

						setChannels((existing) => processFirehoseEvents(existing, events));
					}
				});
			}
		};

		const doLoadDownwards = async () => {
			const curs = cursor();

			// Don't fetch if:
			// - We don't have a cursor (`null` if we've reached the end)
			// - We're currently fetching something else
			if (curs == null || fetching() !== undefined) {
				return;
			}

			const signal = abortable();

			// Set fetching state
			setFetching(FetchState.DOWNWARDS);

			// Defer firehose events, in case anything happens to these.
			pendingEvents = [];

			try {
				const { data } = await rpc.get('chat.bsky.convo.listConvos', {
					signal: signal,
					params: {
						limit: fetchLimit,
						cursor: curs,
					},
				});

				const convos = data.convos;

				// Stop deferring firehose events
				const events = pendingEvents!;
				pendingEvents = undefined;

				batch(() => {
					const key = Date.now();

					// If we returned less than the limit, then we reached the end
					setCursor((convos.length >= fetchLimit && data.cursor) || null);

					// Concatenate to existing list, and process deferred events
					const channels = convos.map((convo) => mergeConvo(did, convo, key));

					setChannels((existing) => processFirehoseEvents([...existing, ...channels], events));

					// Reset fetching state
					setFetching();
				});
			} catch (err) {
				// Ignore error if we've been aborted
				if (signal.aborted) {
					return;
				}

				batch(() => {
					setFetching();
					setFailed({ cause: FailureCause.DOWNWARDS, error: err });

					// Process deferred events
					if (pendingEvents !== undefined) {
						const events = pendingEvents;
						pendingEvents = undefined;

						setChannels((existing) => processFirehoseEvents(existing, events));
					}
				});
			}
		};

		return {
			channels,

			hasNew,
			cursor,
			fetching,
			failed,

			doRefresh() {
				doInitialLoad(true);
			},
			doLoadDownwards,

			mount() {
				if (!init) {
					init = true;

					doInitialLoad();

					runWithOwner(owner, () => {
						onCleanup(
							firehose.emitter.on('event', (event) => {
								if (pendingEvents) {
									pendingEvents.push(event);
									return;
								}

								setChannels((channels) => processFirehoseEvents(channels, [event]));
							}),
						);

						onCleanup(
							firehose.emitter.on('read', (channelId, messageId) => {
								const event: MarkReadEvent = {
									$type: 'mark-read',
									convoId: channelId,
									messageId: messageId,
								};

								if (pendingEvents) {
									pendingEvents.push(event);
									return;
								}

								setChannels((channels) => processFirehoseEvents(channels, [event]));
							}),
						);
					});
				}
			},
			destroy,
		};
	}, null);
};

/** Used to hold mark-read attempts if the firehose is being deferred */
export interface MarkReadEvent {
	$type: 'mark-read';
	convoId: string;
	messageId: string;
}

export const enum FetchState {
	/** Currently fetching the initial channel listing */
	INITIAL,
	/** Currently fetching subsequent channel listing */
	DOWNWARDS,
	/** Currently refreshing the channel listing (initial load) */
	REFRESH,
}

export const enum FailureCause {
	/** Failure came from fetching the initial channel listing */
	INITIAL,
	/** Failure came from fetching subsequent channel listing */
	DOWNWARDS,
	/** Failure came from refreshing the channel listing (initial load) */
	REFRESH,
}

export interface FailureState {
	cause: FailureCause;
	error: unknown;
}
