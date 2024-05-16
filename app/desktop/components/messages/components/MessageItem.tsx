import type { ChatBskyConvoDefs } from '~/api/atp-schema';
import type { SignalizedConvo } from '~/api/stores/convo';

import TimeAgo from '~/com/components/TimeAgo';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import { IconButton } from '~/com/primitives/icon-button';

import { formatChatReltime } from '../utils/intl';

type Message = ChatBskyConvoDefs.MessageView;

/** All props are expected to be static */
export interface MessageItemProps {
	convo: SignalizedConvo;
	item: Message;
	tail?: boolean;
}

const MessageItem = ({ convo, item, tail }: MessageItemProps) => {
	const text = item.text;
	const isSender = convo.self.did == item.sender.did;

	return (
		<div class={`px-3` + (tail ? ` mb-1.5` : ` mb-6`)}>
			<div class={`group flex items-center`}>
				{isSender && (
					<>
						<div class="grow"></div>
						<MessageAction />
					</>
				)}

				<div
					class={
						`rounded-lg px-3 py-2 text-sm` +
						(isSender ? ` bg-accent text-white` : ` bg-secondary/30`) +
						(!tail ? (isSender ? ` rounded-br-none` : ` rounded-bl-none`) : ``)
					}
				>
					<div class="whitespace-pre-wrap break-words text-sm">{text}</div>
				</div>

				{!isSender && (
					<>
						<MessageAction />
						<div class="grow"></div>
					</>
				)}
			</div>

			{!tail && (
				<TimeAgo value={/* @once */ item.sentAt} relative={formatChatReltime}>
					{(relative) => (
						<div class={`mt-1 text-xs text-muted-fg` + (isSender ? ` text-right` : ` text-left`)}>
							{relative()}
						</div>
					)}
				</TimeAgo>
			)}
		</div>
	);
};

export default MessageItem;

interface MessageActionProps {
	end?: boolean;
}

const MessageAction = ({}: MessageActionProps) => {
	return (
		<div class="flex shrink-0 px-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
			<button class={/* @once */ IconButton({ color: 'muted' })}>
				<MoreHorizIcon />
			</button>
		</div>
	);
};
