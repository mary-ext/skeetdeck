import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import VolumeOffOutlinedIcon from '~/com/icons/outline-volume-off';
import { IconButton } from '~/com/primitives/icon-button';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { useChannel } from '../contexts/channel';
import { useChatPane } from '../contexts/chat';
import ChannelOverflowAction from './ChannelOverflowAction';

const ChannelHeader = () => {
	const { router } = useChatPane();
	const { convo } = useChannel();

	return (
		<div class="flex h-13 shrink-0 items-center gap-3 border-b border-divider px-4">
			<button
				title="Return to previous screen"
				onClick={router.back}
				class={/* @once */ IconButton({ edge: 'left' })}
			>
				<ArrowLeftIcon />
			</button>

			{(() => {
				// @todo: just pretend we only have 1:1 DMs for now
				const recipient = convo.recipients.value[0];

				return (
					<div class="flex min-w-0 grow items-center">
						<img
							src={recipient.avatar.value || DefaultUserAvatar}
							class="-ml-2 mr-3 h-6 w-6 shrink-0 rounded-full"
						/>

						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
							{recipient.displayName.value || recipient.handle.value}
						</p>

						{(() => {
							if (convo.muted.value) {
								return <VolumeOffOutlinedIcon class="ml-1 shrink-0 text-sm text-muted-fg" />;
							}
						})()}
					</div>
				);
			})()}

			<div class="flex min-w-0 shrink-0 gap-1 empty:hidden">
				<ChannelOverflowAction convo={convo} onDeleteConfirm={router.back}>
					<button title="Actions" class={/* @once */ IconButton({ edge: 'right' })}>
						<MoreHorizIcon />
					</button>
				</ChannelOverflowAction>
			</div>
		</div>
	);
};

export default ChannelHeader;
