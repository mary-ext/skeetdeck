import { createEffect, createSignal, For, Match, Switch, untrack } from 'solid-js';

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

const ChannelMessages = () => {
	const { firehose, rpc } = useChatPane();
	const { channel, convo } = useChannel();

	let initialMount = true;
	let latestId: string | undefined;
	let ackedId: string | undefined;

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
			} else if (untrack(atBottom) && document.hasFocus()) {
				// We're at the bottom and currently focused
				markRead();
				setUnread();
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
		<div class="relative flex min-h-0 grow flex-col-reverse overflow-y-auto">
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
