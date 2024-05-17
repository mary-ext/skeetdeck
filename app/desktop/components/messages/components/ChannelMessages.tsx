import { createEffect, For, Match, onCleanup, onMount, Switch } from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import type { SignalizedConvo } from '~/api/stores/convo';

import { ifIntersect } from '~/utils/refs';

import { EntryType } from '~/desktop/lib/messages/channel';

import CircularProgress from '~/com/components/CircularProgress';

import { useChatPane } from '../contexts/chat';

import MessageDivider from './MessageDivider';
import MessageItem from './MessageItem';

interface ChannelMessagesProps {
	/** Expected to be static */
	convo: SignalizedConvo;
	/** Maximum amount of messages to fetch at a time */
	fetchLimit: number;
}

const ChannelMessages = (props: ChannelMessagesProps) => {
	let ref: HTMLElement;

	const convo = props.convo;

	const { firehose, channels, rpc } = useChatPane();
	const channel = channels.get(convo.id);

	let initialMount = true;
	let focused = !document.hidden;

	let latestId: string | undefined;
	let unread = false;

	let atBottom = true;

	const onScroll = () => {
		atBottom = ref!.scrollTop >= ref!.scrollHeight - ref!.offsetHeight - 100;

		if (atBottom && unread) {
			unread = false;
			markRead();
		}
	};

	const markRead = () => {
		if (!latestId) {
			return;
		}

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

		onCleanup(firehose.requestPollInterval(3_000));
		makeEventListener(document, 'visibilitychange', () => (focused = !document.hidden));
	});

	createEffect((o: { oldest?: string; height?: number } = {}) => {
		const latest = channel.messages().at(-1)?.id;
		const oldest = channel.messages().at(0)?.id;

		if (latest !== latestId) {
			latestId = latest;

			if ((focused || initialMount) && atBottom) {
				ref!.scrollTo(0, ref!.scrollHeight);

				if (!initialMount || convo.unread.peek()) {
					markRead();
				}

				initialMount = false;
			} else {
				unread = true;
			}
		}

		if (oldest !== o.oldest) {
			o.oldest = oldest;

			if (o.oldest !== undefined && ref!.scrollTop <= 100) {
				const delta = ref!.scrollHeight - o.height! + ref!.scrollTop;
				ref!.scrollTo(0, delta);
			}
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
