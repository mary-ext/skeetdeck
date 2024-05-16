import { batch, createMemo, createSignal, onCleanup } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';

import type { ChatBskyConvoDefs, ChatBskyConvoGetLog } from '~/api/atp-schema';

import { makeAbortable } from '~/utils/hooks';
import { mapDefined } from '~/utils/misc';

import type { ChatFirehose } from './firehose';

type ChannelEvents = ChatBskyConvoGetLog.Output['logs'];
type Message = ChatBskyConvoDefs.MessageView;

export interface ChannelOptions {
	id: string;
	rpc: BskyXRPC;
	firehose: ChatFirehose;
	fetchLimit?: number;
}

export const createChannelState = ({ id: channelId, firehose, rpc, fetchLimit = 50 }: ChannelOptions) => {
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
	let pendingEvents: ChannelEvents | undefined;

	const processFirehoseEvents = (messages: Message[], events: ChannelEvents) => {
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
				setOldestRev(messages.length >= fetchLimit ? data.cursor : null);

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

			// Stop deferring firehose events
			pendingEvents = undefined;
		} catch (err) {
			// Ignore error if we've been aborted
			if (signal.aborted) {
				return;
			}

			// @todo: do something with `err`
			setFetching();
			setFailed(true);
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
		if (!pendingEvents) {
			pendingEvents = [];
		}

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
				// Set oldest revision, if we get `undefined` here then we reached end
				// of history, so set it to `null`.
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

	let entryCache = new Map<string, Entry>();
	const entries = createMemo<Entry[]>(() => {
		const entrants: Entry[] = [];
		const newEntryCache = new Map<string, Entry>();

		const arr = messages();
		for (let idx = 0, len = arr.length; idx < len; idx++) {
			const item = arr[idx];
			const nextItem = arr[idx + 1];

			let date: string | undefined;
			let tail = true;

			if (nextItem) {
				const time = new Date(item.sentAt);
				const nextTime = new Date(nextItem.sentAt);

				if (
					time.getDate() !== nextTime.getDate() ||
					time.getMonth() !== nextTime.getMonth() ||
					time.getFullYear() !== nextTime.getFullYear()
				) {
					date = item.sentAt;
				}

				// Separate messages if:
				// - Not the same author
				// - 7 minutes has elapsed between the two message
				if (item.sender.did !== nextItem.sender.did || nextTime.getTime() - time.getTime() >= 420_000) {
					tail = false;
				}
			} else {
				tail = false;
			}

			{
				const key = `${item.id}:${+tail}`;
				const entry = (entryCache.get(key) as MessageEntry | undefined) ?? {
					type: EntryType.MESSAGE,
					message: item,
					tail,
				};

				newEntryCache.set(key, entry);
				entrants.push(entry);
			}

			if (date) {
				const key = date;
				const entry = (entryCache.get(key) as DividerEntry | undefined) ?? { type: EntryType.DIVIDER, date };

				newEntryCache.set(key, entry);
				entrants.push(entry);
			}
		}

		entryCache = newEntryCache;
		return entrants;
	});

	let destroy: (() => void) | undefined;

	return {
		entries,

		oldestRev,
		fetching,
		failed,

		doLoadUpwards,

		mount() {
			if (!destroy) {
				doInitialLoad();

				destroy = firehose.emitter.on(`log:${channelId}`, (events) => {
					if (pendingEvents) {
						pendingEvents = [...pendingEvents, ...events];
					}

					setMessages((messages) => processFirehoseEvents(messages, events));
				});
			}

			onCleanup(firehose.requestPollInterval(3_000));
		},
		destroy() {
			destroy?.();
		},
	};
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
