import {
	batch,
	createMemo,
	createRoot,
	createSignal,
	getOwner,
	onCleanup,
	onMount,
	runWithOwner,
	untrack,
	type Accessor,
} from 'solid-js';

import * as TID from '@mary/atproto-tid';
import type { BskyXRPC } from '@mary/bluesky-client';

import type { At, ChatBskyConvoDefs } from '~/api/atp-schema';
import { finalizeRt, getRtText, type PreliminaryRichText } from '~/api/richtext/composer';

import { makeAbortable } from '~/utils/hooks';
import { assert, mapDefined } from '~/utils/misc';

import type { ChatFirehose, ConvoEvent } from './firehose';

type MessageView = ChatBskyConvoDefs.MessageView;

export interface ChannelMessage extends ChatBskyConvoDefs.MessageView {
	$failure?: {
		retry(): void;
		remove(): void;
	};
}

export interface ChannelOptions {
	channelId: string;
	did: At.DID;
	rpc: BskyXRPC;
	firehose: ChatFirehose;
	fetchLimit?: number;
}

export type Channel = ReturnType<typeof createChannel>;

export interface RawMessage {
	richtext: PreliminaryRichText;
}

export interface DraftMessage {
	id: string;
	message: ChatBskyConvoDefs.Message;
	failed: boolean;
}

const MAX_MESSAGE_HISTORY = 150;

export const createChannel = ({ channelId, did, firehose, rpc, fetchLimit = 50 }: ChannelOptions) => {
	return createRoot((destroy) => {
		let init = false;

		const owner = getOwner();
		const [abortable] = makeAbortable();

		const sentMessages = new Map<string, ChannelMessage>();

		/** Loaded messages */
		const [messages, setMessages] = createSignal<ChannelMessage[]>([]);

		/** Oldest revision currently stored, `null` if we've reached the end */
		const [oldestRev, setOldestRev] = createSignal<string | null>();

		/** Current fetching state */
		const [fetching, setFetching] = createSignal<FetchState>();
		/** Whether the last fetch has failed */
		const [failed, setFailed] = createSignal(false);

		/** Array of registered views */
		const atBottoms: Accessor<boolean>[] = [];

		/** Firehose events we haven't processed because we're currently fetching */
		let pendingEvents: ConvoEvent[] | undefined;

		const processFirehoseEvents = (messages: MessageView[], events: ConvoEvent[]) => {
			let addition = false;

			for (let idx = 0, len = events.length; idx < len; idx++) {
				const event = events[idx];
				const type = event.$type;

				if (type === 'chat.bsky.convo.defs#logCreateMessage') {
					const message = event.message;

					if (message.$type === 'chat.bsky.convo.defs#messageView') {
						// Check if this is a message we sent from here.
						const placebo = message.sender.did === did ? sentMessages.get(message.id) : undefined;

						addition = true;

						if (placebo !== undefined) {
							// If so, replace the fake message with this real one.
							messages = messages.toSpliced(messages.lastIndexOf(placebo), 1, message);
						} else {
							messages = messages.concat(message);
						}
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

			// Trim message history if it's getting too long.
			if (addition && messages.length > MAX_MESSAGE_HISTORY) {
				if (atBottoms.length === 0 || untrack(() => atBottoms.every((fn) => fn()))) {
					messages = messages.slice(-fetchLimit);
					setOldestRev(messages[0].rev!);
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
					// If we get `undefined` here, we're at the end.
					setOldestRev(data.cursor ?? null);

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
					// If we get `undefined` here, we're at the end.
					setOldestRev(data.cursor ?? null);

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

		const sendMessage = async (raw: RawMessage) => {
			const canPlaceholder = untrack(fetching) !== FetchState.INITIAL;

			// Create a fake message to put on the array
			// We can check that it's fake by making `rev` be an empty string
			const placebo: ChannelMessage = {
				id: TID.now(),
				rev: '',
				sender: { did },
				sentAt: new Date().toISOString(),
				text: getRtText(raw.richtext),
			};

			// Don't do placeholders if we're still retrieving the initial history
			if (canPlaceholder) {
				setMessages(($messages) => $messages.concat(placebo));
			}

			try {
				// Resolve the richtext, and send the message
				const rt = await finalizeRt(did, raw.richtext);

				const { data } = await rpc.call('chat.bsky.convo.sendMessage', {
					data: {
						convoId: channelId,
						message: {
							text: rt.text,
							facets: rt.facets,
						},
					},
				});

				if (canPlaceholder) {
					// Assign the fake message to the actual message ID so it'd be swapped
					sentMessages.set(data.id, placebo);
				}

				// Request a poll immediately
				firehose.poll();
			} catch (err) {
				// If it fails, replace with another fake message that has a retry method
				const replaced: ChannelMessage = {
					...placebo,
					id: TID.now(),
					$failure: {
						remove() {
							setMessages(($messages) => $messages.toSpliced($messages.lastIndexOf(replaced), 1));
						},
						retry() {
							batch(() => {
								replaced.$failure!.remove();
								sendMessage(raw);
							});
						},
					},
				};

				if (canPlaceholder) {
					setMessages(($messages) => $messages.toSpliced($messages.lastIndexOf(placebo), 1, replaced));
				} else {
					// Insert as the last message since we didn't insert a placeholder before
					setMessages(($messages) => $messages.concat(replaced));
				}
			}
		};

		const deleteMessage = async (messageId: string) => {
			await rpc.call('chat.bsky.convo.deleteMessageForSelf', {
				data: {
					convoId: channelId,
					messageId: messageId,
				},
			});

			firehose.poll();
		};

		return {
			messages,

			oldestRev,
			fetching,
			failed,

			doLoadUpwards,
			sendMessage,
			deleteMessage,

			destroy,
			mount({ unread, atBottom }: { unread: Accessor<string | undefined>; atBottom: Accessor<boolean> }) {
				onMount(() => {
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
				});

				{
					atBottoms.push(atBottom);
					onCleanup(() => atBottoms.splice(atBottoms.indexOf(atBottom), 1));
				}

				let entryCache = new Map<string, Entry>();
				const entries = createMemo<Entry[]>(() => {
					const entrants: Entry[] = [];
					const newEntryCache = new Map<string, Entry>();

					const $unread = unread();

					const arr = messages();
					let group: MessageView[] | undefined;
					let insertedUnread = $unread === undefined;

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

					const pushDivider = (date: string, unread = false) => {
						const key = `${date}:${+unread}`;
						const entry = (entryCache.get(key) as DividerEntry | undefined) ?? {
							type: EntryType.DIVIDER,
							date,
							unread,
						};

						newEntryCache.set(key, entry);
						entrants.push(entry);
					};

					for (let idx = 0, len = arr.length; idx < len; idx++) {
						const item = arr[idx];

						// We're at the first message in history, push a divider.
						if (idx === 0 && oldestRev() === null) {
							pushDivider(item.sentAt);
						}

						if (!insertedUnread && item.rev !== '' && item.rev >= $unread!) {
							insertedUnread = true;

							if (group) {
								flushGroup();
							}

							pushDivider(item.sentAt, true);
						}

						if (item.$failure !== undefined) {
							if (group) {
								flushGroup();
							}

							group = [item];
							flushGroup();
							continue;
						}

						// First message in group
						if (!group) {
							group = [item];
							continue;
						}

						// Grab the first and last message in group
						const firstInGroup = group[0];
						const lastInGroup = group[group.length - 1];

						const m = firstInGroup !== lastInGroup;

						{
							const a = new Date(lastInGroup.sentAt);
							const b = new Date(item.sentAt);

							const sameDate = isSameDate(a, b);

							// Separate messages if:
							// - Not the same date
							// - Not the same author
							// - 7 minutes has elapsed between this and the last in group
							// - 14 minutes has elapsed between this and the first in group
							if (
								!sameDate ||
								item.sender.did !== lastInGroup.sender.did ||
								b.getTime() - a.getTime() >= 420_000 ||
								(m && b.getTime() - new Date(firstInGroup.sentAt).getTime() >= 840_000)
							) {
								// Flush the group
								flushGroup();

								// Push a divider if it's specifically not the same date
								if (!sameDate) {
									pushDivider(item.sentAt);
								}

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

				return { entries };
			},
		};
	}, null);
};

const isSameDate = (a: Date, b: Date) => {
	return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
};

export interface MessageEntry {
	type: EntryType.MESSAGE;
	message: MessageView;
	tail: boolean;
}

export interface UnsentMessageEntry {}

export interface DividerEntry {
	type: EntryType.DIVIDER;
	date: string;
	unread: boolean;
}

export type Entry = MessageEntry | DividerEntry;

export const enum EntryType {
	MESSAGE,
	UNSENT_MESSAGE,
	DIVIDER,
}

export const enum FetchState {
	INITIAL,
	UPWARDS,
}
