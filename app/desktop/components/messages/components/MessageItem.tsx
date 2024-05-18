import type { ChatBskyConvoDefs } from '~/api/atp-schema';
import type { SignalizedConvo } from '~/api/stores/convo';

import RichTextRenderer from '~/com/components/RichTextRenderer';
import TimeAgo from '~/com/components/TimeAgo';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import { IconButton } from '~/com/primitives/icon-button';

import { formatChatReltime } from '../utils/intl';
import MessageOverflowAction from './MessageOverflowAction';

type Message = ChatBskyConvoDefs.MessageView;

/** All props are expected to be static */
export interface MessageItemProps {
	convo: SignalizedConvo;
	item: Message;
	tail?: boolean;
}

const MessageItem = ({ convo, item, tail }: MessageItemProps) => {
	const isSender = convo.self.did == item.sender.did;
	const isDraft = isSender && item.rev === '';

	return (
		<div class={`px-3` + (tail ? ` mb-1.5` : ` mb-6`)}>
			<div class={`group flex items-center`}>
				{isSender && (
					<>
						<div class="grow"></div>
						<MessageAccessory item={item} />
					</>
				)}

				<div
					class={
						`rounded-lg px-3 py-2 text-sm` +
						(isSender ? ` bg-accent text-white` : ` bg-secondary/30`) +
						(!tail ? (isSender ? ` rounded-br-none` : ` rounded-bl-none`) : ``) +
						(isDraft ? ` opacity-60` : ``)
					}
				>
					<div class="whitespace-pre-wrap break-words text-sm">
						<RichTextRenderer item={item} get={(item) => ({ t: item.text, f: item.facets })} />
					</div>
				</div>

				{!isSender && (
					<>
						<MessageAccessory item={item} />
						<div class="grow"></div>
					</>
				)}
			</div>

			{!tail && (
				<TimeAgo value={/* @once */ item.sentAt} relative={formatChatReltime}>
					{(relative) => (
						<div class={`mt-1.5 text-xs text-muted-fg` + (isSender ? ` text-right` : ` text-left`)}>
							{relative()}
						</div>
					)}
				</TimeAgo>
			)}
		</div>
	);
};

export default MessageItem;

export interface MessageAccessoryProps {
	/** Expected to be static */
	item: Message;
}

const MessageAccessory = ({ item }: MessageAccessoryProps) => {
	return (
		<div class="flex shrink-0 px-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
			<MessageOverflowAction item={item}>
				<button class={/* @once */ IconButton({ color: 'muted' })}>
					<MoreHorizIcon />
				</button>
			</MessageOverflowAction>
		</div>
	);
};
