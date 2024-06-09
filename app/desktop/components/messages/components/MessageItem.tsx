import type { SignalizedConvo } from '~/api/stores/convo';

import RichTextRenderer from '~/com/components/RichTextRenderer';
import TimeAgo from '~/com/components/TimeAgo';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import { IconButton } from '~/com/primitives/icon-button';

import type { ChannelMessage } from '~/desktop/lib/messages/channel';

import { formatChatReltime } from '../utils/intl';
import MessageOverflowAction from './MessageOverflowAction';

/** All props are expected to be static */
export interface MessageItemProps {
	convo: SignalizedConvo;
	item: ChannelMessage;
	tail?: boolean;
}

const MessageItem = ({ convo, item, tail }: MessageItemProps) => {
	const isSender = convo.self.did == item.sender.did;

	const isDraft = isSender && item.rev === '';
	const failure = isDraft && item.$failure;

	return (
		<div class={`px-3` + (tail ? ` mb-1.5` : ` mb-6`)}>
			<div class={`group flex items-center`}>
				{isSender && (
					<>
						<div class="grow"></div>
						<MessageAccessory item={item} draft={isDraft} />
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
						<RichTextRenderer text={/* @once */ item.text} facets={/* @once */ item.facets} />
					</div>
				</div>

				{!isSender && (
					<>
						<MessageAccessory item={item} />
						<div class="grow"></div>
					</>
				)}
			</div>

			{failure ? (
				<div class="mt-1.5 text-right text-xs text-muted-fg">
					<span class="text-red-500">Failed to send</span>
					<span class="px-1">·</span>
					<button onClick={failure.retry} class="text-accent hover:underline">
						Retry
					</button>
					<span class="px-1">·</span>
					<button onClick={failure.remove} class="text-accent hover:underline">
						Delete message
					</button>
				</div>
			) : !tail ? (
				<TimeAgo value={/* @once */ item.sentAt} relative={formatChatReltime}>
					{(relative) => (
						<div class={`mt-1.5 text-xs text-muted-fg` + (isSender ? ` text-right` : ` text-left`)}>
							{relative()}
						</div>
					)}
				</TimeAgo>
			) : null}
		</div>
	);
};

export default MessageItem;

export interface MessageAccessoryProps {
	/** Expected to be static */
	item: ChannelMessage;
	/** Expected to be static */
	draft?: boolean;
}

const MessageAccessory = ({ item, draft }: MessageAccessoryProps) => {
	return (
		<div class="flex shrink-0 gap-1 px-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
			{!draft ? (
				<MessageOverflowAction item={item}>
					<button title="Actions" class={/* @once */ IconButton({ color: 'muted' })}>
						<MoreHorizIcon />
					</button>
				</MessageOverflowAction>
			) : (
				<div class="w-8"></div>
			)}
		</div>
	);
};
