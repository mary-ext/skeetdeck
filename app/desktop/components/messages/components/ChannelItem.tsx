import { createMemo } from 'solid-js';

import type { SignalizedConvo } from '~/api/stores/convo';

import { isElementClicked } from '~/utils/interaction';

import TimeAgo from '~/com/components/TimeAgo';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import { IconButton } from '~/com/primitives/icon-button';
import { Interactive } from '~/com/primitives/interactive';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { useChatPane } from '../contexts/chat';
import { isChatDeletedAccount } from '../utils/chat';

import ChannelOverflowAction from './ChannelOverflowAction';

export interface ChannelItemProps {
	/** Expected to be static */
	item: SignalizedConvo;
	onClick?: () => void;
}

const itemClass = Interactive({
	class: `flex items-start gap-3 px-4 py-3 text-left`,
});

const ChannelItem = (props: ChannelItemProps) => {
	const { did } = useChatPane();

	const item = props.item;
	const onClick = props.onClick;

	const handleClick = (ev: MouseEvent) => {
		if (!isElementClicked(ev)) {
			return;
		}

		onClick!();
	};

	const isDeleted = createMemo(() => {
		return isChatDeletedAccount(item);
	});

	return (
		<button class={itemClass} onClick={onClick && handleClick}>
			{(() => {
				// @todo: just pretend we only have 1:1 DMs for now
				const recipient = item.recipients.value[0];

				return (
					<>
						<img
							src={recipient.avatar.value || DefaultUserAvatar}
							class="mt-px h-10 w-10 shrink-0 rounded-full"
						/>

						<div class="min-w-0 grow">
							<div class="mb-0.5 flex items-center justify-between gap-3">
								<div class="flex grow items-center overflow-hidden text-sm text-muted-fg">
									{(() => {
										if (isDeleted()) {
											return (
												<span class="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-primary">
													Deleted account
												</span>
											);
										}

										return (
											<span class="flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
												{recipient.displayName.value && (
													<bdi class="overflow-hidden text-ellipsis">
														<span class="font-bold text-primary">{recipient.displayName.value}</span>
													</bdi>
												)}

												<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
													@{recipient.handle.value}
												</span>
											</span>
										);
									})()}

									{item.lastMessage.value && (
										<>
											<span class="px-1">·</span>
											<TimeAgo value={item.lastMessage.value.sentAt}>
												{(relative, absolute) => (
													<span title={absolute()} class="whitespace-nowrap">
														{relative()}
													</span>
												)}
											</TimeAgo>
										</>
									)}
								</div>

								{item.unread.value && (
									<div
										class={
											`h-1.5 w-1.5 shrink-0 rounded-full` +
											(!item.muted.value ? ` bg-accent` : ` bg-secondary`)
										}
									></div>
								)}

								<ChannelOverflowAction convo={item}>
									<button class={/* @once */ IconButton({ class: '-m-1.5 -mx-2', color: 'muted' })}>
										<MoreHorizIcon />
									</button>
								</ChannelOverflowAction>
							</div>

							<div
								class={
									`line-clamp-1 whitespace-pre-wrap break-words text-sm empty:hidden` +
									(item.unread.value
										? ` font-bold` + (item.muted.value ? ` text-muted-fg` : ``)
										: ` text-muted-fg`)
								}
							>
								{(() => {
									const message = item.lastMessage.value;

									if (message) {
										if (message.$type === 'chat.bsky.convo.defs#messageView') {
											if (message.sender.did === did) {
												return `You: ${message.text}`;
											}

											return message.text;
										} else if (message.$type === 'chat.bsky.convo.defs#deletedMessageView') {
											return <i>Message deleted</i>;
										}
									}

									if (isDeleted()) {
										return <i>Conversation deleted</i>;
									}

									return <i>No messages yet</i>;
								})()}
							</div>
						</div>
					</>
				);
			})()}
		</button>
	);
};

export default ChannelItem;
