import type { At } from '~/api/atp-schema';
import type { SignalizedConvo } from '~/api/stores/convo';

import TimeAgo from '~/com/components/TimeAgo';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import { Interactive } from '~/com/primitives/interactive';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

export interface ChannelItemProps {
	/** Expected to be static */
	uid: At.DID;
	/** Expected to be static */
	item: SignalizedConvo;
}

const itemClass = Interactive({
	class: `flex items-start gap-3 px-4 py-3 text-left`,
});

const ChannelItem = (props: ChannelItemProps) => {
	const item = props.item;

	return (
		<button class={itemClass}>
			{(() => {
				// @todo: just pretend we only have 1:1 DMs for now
				const recipient = item.members.value[0];

				return (
					<>
						<img
							src={recipient.avatar.value || DefaultUserAvatar}
							class="mt-px h-10 w-10 shrink-0 rounded-full"
						/>

						<div class="min-w-0 grow">
							<div class="mb-0.5 flex items-center justify-between gap-3">
								<div class="flex grow items-center overflow-hidden text-sm text-muted-fg">
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

								<button class="-m-1.5 -mx-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary/40">
									<MoreHorizIcon />
								</button>
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
											return message.text;
										} else if (message.$type === 'chat.bsky.convo.defs#deletedMessageView') {
											return <i>Message deleted</i>;
										}
									}

									return <i>It's empty here.</i>;
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