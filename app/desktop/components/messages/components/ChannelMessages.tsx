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
		const oldest = channel.messages().at(0)?.id;

		if (latest !== latestId) {
			// New message!
			latestId = latest;
			debug(`new message; id=${latest}`);

			// If this is an initial mount, or we're at the bottom while focused
			if (initialMount || (atBottom && focused)) {
				debug(`scrolling to bottom; initial=${initialMount}`);

				// Scroll to bottom so that this new message appears
				ref!.scrollTo(0, ref!.scrollHeight);

				// Mark as read, except if it's an initial mount and we know for certain
				// that there's no unread here.
				if (!initialMount || convo.unread.peek()) {
					markRead();
				}

				// We've mounted, so unset this.
				initialMount = false;
			} else if (untrack(unread) === undefined) {
				debug(`new unread; id=${latest}`);

				// We're at the start of an unread session
				setUnread(latest);
			}
		}

		if (oldest !== o.oldest) {
			// Past message history loaded!
			debug(`old message; id=${oldest}`);

			if (o.oldest !== undefined && ref!.scrollTop <= 100) {
				// Maintain current scroll position
				const delta = ref!.scrollHeight - o.height! + ref!.scrollTop;
				ref!.scrollTo(0, delta);
			}

			o.oldest = oldest;
		}

		o.height = ref!.scrollHeight;
		return o;
	});

	return (
		<div ref={(node) => (ref = node)} onScroll={onScroll} class="flex min-h-0 grow flex-col overflow-y-auto">
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
	);
};

export default ChannelMessages;
