import { batch, createMemo, createRoot, createSignal, getOwner, onCleanup, runWithOwner } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';

import type { ChatBskyConvoDefs } from '~/api/atp-schema';

import { makeAbortable } from '~/utils/hooks';
import { assert, mapDefined } from '~/utils/misc';

import type { ChatFirehose, ConvoEvent } from './firehose';

type Message = ChatBskyConvoDefs.MessageView;

export interface ChannelOptions {
	id: string;
	rpc: BskyXRPC;
	firehose: ChatFirehose;
	fetchLimit?: number;
}

export type Channel = ReturnType<typeof createChannel>;

export const createChannel = ({ id: channelId, firehose, rpc, fetchLimit = 50 }: ChannelOptions) => {
	return createRoot((destroy) => {
		let init = false;

		const owner = getOwner();
		const abortable = makeAbortable();

		/** Loaded messages */
		const [messages, setMessages] = createSignal<Message[]>([]);

		/** Oldest revision currently stored, `null` if we've reached the end */
		const [oldestRev, setOldestRev] = createSignal<string | null>();

		/** Current fetching state */
		const [fetching, setFetching] = createSignal<FetchState>();
		/** Whether the last fetch has failed */
		const [failed, setFailed] = createSignal(false);

		/** Firehose events we haven't processed because we're currently fetching */
		let pendingEvents: ConvoEvent[] | undefined;

		const processFirehoseEvents = (messages: Message[], events: ConvoEvent[]) => {
			for (let idx = 0, len = events.length; idx < len; idx++) {
				const event = events[idx];
				const type = event.$type;

				if (type === 'chat.bsky.convo.defs#logCreateMessage') {
					const message = event.message;

					if (message.$type === 'chat.bsky.convo.defs#messageView') {
						messages = messages.concat(message);
					}
				} else if (type === 'chat.bsky.convo.defs#logDeleteMessage') {
					// Can be expensive, but it's also somewhat rare, message can't be
					// unsent, only deleted from your view.
					const message = event.message;
					const id = message.id;

					for (let j = 0, jl = messages.length; j < jl; j++) {
						const x = messages[j];

						if (x.id === id) {
							messages = messages.toSpliced(j, 1);
							break;
						}
					}
				}
			}

			return messages;
		};

		const doInitialLoad = async () => {
			const signal = abortable();

			// setMessages([]);
			// setOldestRev(undefined);

			// Set fetching state
			setFetching(FetchState.INITIAL);

			// Start deferring events from firehose
			pendingEvents = [];

			try {
				const { data } = await rpc.get('chat.bsky.convo.getMessages', {
					signal: signal,
					params: {
						convoId: channelId,
						limit: fetchLimit,
					},
				});

				const messages = data.messages.reverse();

				// Stop deferring firehose events
				const events = pendingEvents!;
				pendingEvents = undefined;

				batch(() => {
					// If we returned less than the limit, we're at the start of the convo
					setOldestRev((messages.length >= fetchLimit && data.cursor) || null);

					// If we've not received any events from firehose, set it as is
					if (events.length === 0) {
						setMessages(messages.filter((m) => m.$type === 'chat.bsky.convo.defs#messageView'));
					} else {
						// Only include messages older than what we have from the firehose

						const oldestFromFirehose = events[0].rev;
						const narrowedHistory = mapDefined(messages, (m) => {
							if (oldestFromFirehose > m.rev && m.$type === 'chat.bsky.convo.defs#messageView') {
								return m;
							}
						});

						// Process firehose events to completion
						const processed = processFirehoseEvents(narrowedHistory, events);

						setMessages(processed);
					}

					// Reset fetching state
					setFetching();
				});
			} catch (err) {
				// Ignore error if we've been aborted
				if (signal.aborted) {
					return;
				}

				// @todo: do something with `err`
				setFetching();
				setFailed(true);

				// Process deferred events
				if (pendingEvents !== undefined) {
					const events = pendingEvents;
					pendingEvents = undefined;

					setMessages((existing) => processFirehoseEvents(existing, events));
				}
			}
		};

		const doLoadUpwards = async () => {
			const cursor = oldestRev();

			// Don't fetch if:
			// - We don't have a cursor (`null` if we've already reached the end)
			// - We're currently fetching something else
			if (cursor == null || fetching() !== undefined) {
				return;
			}

			const signal = abortable();

			// Set fetching state
			setFetching(FetchState.UPWARDS);

			// Defer firehose events, in case deletions happens upwards
			pendingEvents = [];

			try {
				const { data } = await rpc.get('chat.bsky.convo.getMessages', {
					signal: signal,
					params: {
						convoId: channelId,
						limit: fetchLimit,
						cursor: cursor,
					},
				});

				const messages = data.messages.reverse();
				const filtered = messages.filter((m) => m.$type === 'chat.bsky.convo.defs#messageView');

				// Stop deferring firehose events
				const events = pendingEvents!;
				pendingEvents = undefined;

				batch(() => {
					// If we returned less than the limit, we're at the start of the convo
					setOldestRev((messages.length >= fetchLimit && data.cursor) || null);

					// Concatenate to existing message history, and process deferred events
					setMessages((existing) => processFirehoseEvents([...filtered, ...existing], events));

					// Reset fetching state
					setFetching();
				});
			} catch (err) {
				// Ignore error if we've been aborted
				if (signal.aborted) {
					return;
				}

				// @todo: do something with `err`
				setFetching();
				setFailed(true);

				// Process deferred events
				if (pendingEvents !== undefined) {
					const events = pendingEvents;
					pendingEvents = undefined;

					setMessages((existing) => processFirehoseEvents(existing, events));
				}
			}
		};

		let entryCache = new Map<string, Entry>();
		const entries = createMemo<Entry[]>(() => {
			const entrants: Entry[] = [];
			const newEntryCache = new Map<string, Entry>();

			const arr = messages();
			let group: Message[] | undefined;

			const flushGroup = () => {
				assert(group !== undefined, `expected group to exist`);

				for (let idx = 0, len = group.length; idx < len; idx++) {
					const msg = group[idx];
					const tail = idx !== len - 1;

					const key = `${msg.id}:${+tail}`;
					const entry = (entryCache.get(key) as MessageEntry | undefined) ?? {
						type: EntryType.MESSAGE,
						message: msg,
						tail: tail,
					};

					newEntryCache.set(key, entry);
					entrants.push(entry);
				}

				group = undefined;
			};

			const pushDivider = (date: string) => {
				const entry = (entryCache.get(date) as DividerEntry | undefined) ?? { type: EntryType.DIVIDER, date };

				newEntryCache.set(date, entry);
				entrants.push(entry);
			};

			for (let idx = 0, len = arr.length; idx < len; idx++) {
				const item = arr[idx];

				// We're at the first message in history, push a divider.
				if (idx === 0 && oldestRev() === null) {
					pushDivider(item.sentAt);
				}

				// First message in group
				if (!group) {
					group = [item];
					continue;
				}

				// Grab the first and last message in group
				const firstInGroup = group[0];
				const lastInGroup = group[group.length - 1];

				{
					const a = new Date(lastInGroup.sentAt);
					const b = new Date(item.sentAt);

					// Check if it's still the same date
					if (
						b.getDate() !== a.getDate() ||
						b.getMonth() !== a.getMonth() ||
						b.getFullYear() !== a.getFullYear()
					) {
						// It's not, so let's flush this group
						flushGroup();

						// Push a divider
						pushDivider(item.sentAt);

						// Rewind since we haven't dealt with this item yet
						idx--;
						continue;
					}

					// Separate messages if:
					// - Not the same author
					// - 7 minutes has elapsed between this and the last in group
					// - 14 minutes has elapsed between this and the first in group
					if (
						item.sender.did !== lastInGroup.sender.did ||
						b.getTime() - a.getTime() >= 420_000 ||
						b.getTime() - new Date(firstInGroup.sentAt).getTime() >= 840_000
					) {
						// Flush the group
						flushGroup();

						// Rewind since we haven't dealt with this item yet
						idx--;
						continue;
					}
				}

				// We passed all those checks from above, so push it to the group array.
				group.push(item);
			}

			// Flush the remaining group, there's guaranteed to be one if there's at
			// least one message in the array.
			if (group) {
				flushGroup();
			}

			// Override the entry cache with the new one.
			entryCache = newEntryCache;
			return entrants;
		});

		return {
			messages,
			entries,

			oldestRev,
			fetching,
			failed,

			doLoadUpwards,

			mount() {
				if (!init) {
					init = true;

					doInitialLoad();

					runWithOwner(owner, () => {
						onCleanup(
							firehose.emitter.on('event', (event) => {
								if (event.convoId === channelId) {
									if (pendingEvents) {
										pendingEvents.push(event);
										return;
									}

									setMessages((messages) => processFirehoseEvents(messages, [event]));
								}
							}),
						);
					});
				}
			},
			destroy,
		};
	}, null);
};

export interface MessageEntry {
	type: EntryType.MESSAGE;
	message: Message;
	tail: boolean;
}

export interface DividerEntry {
	type: EntryType.DIVIDER;
	date: string;
}

export type Entry = MessageEntry | DividerEntry;

export const enum EntryType {
	MESSAGE,
	DIVIDER,
}

export const enum FetchState {
	INITIAL,
	UPWARDS,
}
