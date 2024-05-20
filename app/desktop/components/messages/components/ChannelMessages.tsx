import { createEffect, createSignal, For, Match, Switch, untrack } from 'solid-js';

import type { ChatBskyConvoDefs } from '~/api/atp-schema';

import { scrollObserver } from '~/utils/intersection-observer';
import { ifIntersect } from '~/utils/refs';

import { EntryType } from '~/desktop/lib/messages/channel';

import CircularProgress from '~/com/components/CircularProgress';

import { useChannel } from '../contexts/channel';
import { useChatPane } from '../contexts/chat';
import MessageDivider from './MessageDivider';
import MessageItem from './MessageItem';

function debug(msg: string) {
	if (import.meta.env.DEV) {
		console.log(`%c[chat-messages]%c ${msg}`, `color: #ff4500`, ``);
	}
}

export interface ChannelMessagesRef {
	jumpToBottom(): void;
	scrollUp(): void;
	scrollDown(): void;
}

export interface ChannelMessagesProps {
	ref?: (ref: ChannelMessagesRef) => void;
}

const ChannelMessages = (props: ChannelMessagesProps) => {
	let ref: HTMLElement;

	const { did, firehose, rpc, isOpen } = useChatPane();
	const { channel, convo } = useChannel();

	let initialMount = true;
	let latestId: string | undefined;
	let ackedId: string | undefined;

	let scrollY: number | undefined;

	const [atBottom, setAtBottom] = createSignal(true);
	const [unread, setUnread] = createSignal<string>();
	const { entries } = channel.mount({ unread, atBottom });

	const markRead = () => {
		if (!latestId || latestId === ackedId) {
			return;
		}

		debug(`marking as read; id=${latestId}`);

		ackedId = latestId;

		firehose.emitter.emit('read', convo.id, latestId);

		rpc.call('chat.bsky.convo.updateRead', {
			data: {
				convoId: convo.id,
				messageId: latestId,
			},
		});
	};

	const onScroll = () => {
		scrollY = ref!.scrollTop;
	};

	createEffect(() => {
		props.ref?.({
			jumpToBottom() {
				ref!.scrollTop = 0;
				markRead();
			},
			scrollUp() {
				const next = ref!.scrollTop - 0.9 * ref!.offsetHeight;
				ref!.scrollTo({ top: next, behavior: 'auto' });
			},
			scrollDown() {
				const next = ref!.scrollTop + 0.9 * ref!.offsetHeight;
				ref!.scrollTo({ top: next, behavior: 'auto' });
			},
		});
	});

	createEffect((prev: ChatBskyConvoDefs.MessageView | undefined) => {
		const messages = channel.messages();
		const last = messages[messages.length - 1];

		if (last === undefined) {
			return undefined;
		} else if (last.rev === '') {
			return prev;
		}

		if (prev === undefined || last.rev > prev.rev) {
			// New message!
			latestId = last.id;

			const ours = last.sender.did === did;

			if (initialMount) {
				// This is the initial mount, only mark as read when it's certain
				if (convo.unread.peek()) {
					markRead();
				}

				initialMount = false;
			} else if (ours || (untrack(atBottom) && untrack(isOpen) && document.hasFocus())) {
				// We're at the bottom and currently focused, or last message is ours.
				markRead();

				// Only unset unread if it's our post
				if (ours) {
					setUnread();
				}
			} else if (untrack(unread) === undefined) {
				// Start of a new unread session

				debug(`new unread; rev=${last.rev}`);
				setUnread(last.rev);

				// Make sure the browser doesn't stick
				if (ref!.scrollTop === 0) {
					ref!.scrollTop = -1;
				}
			}
		}

		return last;
	});

	createEffect((prev: ChatBskyConvoDefs.MessageView | undefined) => {
		const messages = channel.messages();
		const first = messages[0];

		if (first === undefined) {
			return undefined;
		} else if (first.rev === '') {
			return prev;
		}

		if (prev !== undefined && first.rev < prev.rev) {
			// Old message loaded, set our last known scroll position in case
			// the browser lost track of it.
			if (scrollY !== undefined) {
				ref!.scrollTop = scrollY;
			}
		}

		return first;
	});

	return (
		<div
			ref={(node) => (ref = node)}
			onScroll={onScroll}
			class="relative flex min-h-0 grow flex-col-reverse overflow-y-auto"
		>
			<div>
				<Switch>
					<Match when={channel.oldestRev() === null}>
						<div class="px-3 py-6">
							<p class="text-sm text-muted-fg">This is the start of your message history.</p>
						</div>
					</Match>

					<Match when={channel.fetching() != null || channel.oldestRev() != null}>
						<div
							ref={ifIntersect(
								() => channel.oldestRev() != null && channel.fetching() == null,
								channel.doLoadUpwards,
							)}
							class="grid h-13 shrink-0 place-items-center"
						>
							<CircularProgress />
						</div>
					</Match>
				</Switch>
				<For each={entries()}>
					{(entry) => {
						const type = entry.type;

						if (type === EntryType.MESSAGE) {
							return (
								<MessageItem convo={convo} item={/* @once */ entry.message} tail={/* @once */ entry.tail} />
							);
						}

						if (type === EntryType.DIVIDER) {
							return <MessageDivider {...entry} />;
						}

						return null;
					}}
				</For>
				<div
					ref={(node) => {
						// @ts-expect-error
						node.$onintersect = (entry: IntersectionObserverEntry) => {
							setAtBottom(entry.isIntersecting);

							if (atBottom() && unread() !== undefined) {
								markRead();
							}
						};

						scrollObserver.observe(node);
					}}
					style="height:64px"
					class="pointer-events-none absolute bottom-0 w-full"
				></div>
			</div>
		</div>
	);
};

export default ChannelMessages;
