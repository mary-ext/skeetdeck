import { createEffect, createSignal, For, Match, onMount, Switch, untrack } from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import type { SignalizedConvo } from '~/api/stores/convo';

import { ifIntersect } from '~/utils/refs';

import { EntryType, type Channel } from '~/desktop/lib/messages/channel';

import CircularProgress from '~/com/components/CircularProgress';

import { useChatPane } from '../contexts/chat';

import MessageDivider from './MessageDivider';
import MessageItem from './MessageItem';

function debug(msg: string) {
	if (import.meta.env.DEV) {
		console.log(`%c[chat-messages]%c ${msg}`, `color: #ff4500`, ``);
	}
}

interface ChannelMessagesProps {
	/** Expected to be static */
	convo: SignalizedConvo;
	/** Expected to be static */
	channel: Channel;
}

const ChannelMessages = (props: ChannelMessagesProps) => {
	let ref: HTMLElement;

	const { rpc } = useChatPane();

	const convo = props.convo;
	const channel = props.channel;

	let initialMount = true;
	let focused = !document.hidden;
	let latestId: string | undefined;
	const [unread, setUnread] = createSignal<string>();

	let atBottom = true;

	const onScroll = () => {
		atBottom = ref!.scrollTop >= ref!.scrollHeight - ref!.offsetHeight - 100;

		if (atBottom && unread() !== undefined) {
			setUnread(undefined);
			markRead();
		}
	};

	const markRead = () => {
		if (!latestId) {
			return;
		}

		debug(`marking as read; id=${latestId}`);

		// @todo: fire mark-read event

		rpc.call('chat.bsky.convo.updateRead', {
			data: {
				convoId: convo.id,
				messageId: latestId,
			},
		});
	};

	onMount(() => {
		channel.mount();
		makeEventListener(document, 'visibilitychange', () => (focused = !document.hidden));
	});

	createEffect((o: { oldest?: string; height?: number } = {}) => {
		const latest = channel.messages().at(-1)?.id;

		if (latest !== latestId) {
			// New message!
			latestId = latest;

			if (initialMount) {
				// This is the initial mount, only mark as read when it's certain
				if (convo.unread.peek()) {
					markRead();
				}

				initialMount = false;
			} else if (atBottom && focused) {
				// We're at the bottom and currently focused
				markRead();
			} else if (untrack(unread) === undefined) {
				// Start of a new unread session

				debug(`new unread; id=${latest}`);
				setUnread(latest);
			} else {
				// @todo: make sure it's anchored to the unread divider somehow
			}
		}

		return o;
	});

	return (
		<div
			ref={(node) => (ref = node)}
			onScroll={onScroll}
			class="flex min-h-0 grow flex-col-reverse overflow-y-auto"
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
				<For each={channel.entries()}>
					{(entry) => {
						const type = entry.type;

						if (type === EntryType.MESSAGE) {
							return (
								<MessageItem convo={convo} item={/* @once */ entry.message} tail={/* @once */ entry.tail} />
							);
						}

						if (type === EntryType.DIVIDER) {
							return <MessageDivider date={/* @once */ entry.date} />;
						}

						return null;
					}}
				</For>
			</div>
		</div>
	);
};

export default ChannelMessages;
