import { For, onCleanup, onMount } from 'solid-js';

import type { SignalizedConvo } from '~/api/stores/convo';

import { EntryType } from '~/desktop/lib/messages/channel';

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
	const convo = props.convo;

	const { firehose, channels } = useChatPane();
	const channel = channels.get(convo.id);

	onMount(() => {
		channel.mount();
		onCleanup(firehose.requestPollInterval(3_000));
	});

	return (
		<div class="flex min-h-0 grow flex-col overflow-y-auto pt-6">
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
