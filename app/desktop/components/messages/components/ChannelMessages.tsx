import { createEffect, createSignal, For, Match, onCleanup, onMount, Switch, untrack } from 'solid-js';

import type { SignalizedConvo } from '~/api/stores/convo';

import { EntryType, FetchState } from '~/desktop/lib/messages/channel';

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

	const { firehose, channels } = useChatPane();
	const channel = channels.get(convo.id);

	let atBottom = true;

	const onScroll = () => {
		atBottom = ref!.scrollTop >= ref!.scrollHeight - ref!.offsetHeight - 100;
	};

	onMount(() => {
		channel.mount();
		onCleanup(firehose.requestPollInterval(3_000));
	});

	createEffect(() => {
		if (channel.entries()) {
			if (atBottom) {
				ref!.scrollTo(0, ref!.scrollHeight);
			}
		}
	});

	return (
		<div ref={(node) => (ref = node)} onScroll={onScroll} class="flex min-h-0 grow flex-col overflow-y-auto">
			<Switch>
				<Match when={channel.oldestRev() === null}>
					<div class="px-3 py-6">
						<p class="text-sm text-muted-fg">This is the start of your message history.</p>
					</div>
				</Match>

				<Match when>
					<div class="pt-6"></div>
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
