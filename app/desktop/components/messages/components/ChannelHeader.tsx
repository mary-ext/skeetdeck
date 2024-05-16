import type { SignalizedConvo } from '~/api/stores/convo';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import { IconButton } from '~/com/primitives/icon-button';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { useChatPane } from '../contexts/chat';

export interface ChannelHeaderProps {
	/** Expected to be static */
	convo: SignalizedConvo;
}

const ChannelHeader = (props: ChannelHeaderProps) => {
	const { router } = useChatPane();
	const convo = props.convo;

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
					<>
						<img
							src={recipient.avatar.value || DefaultUserAvatar}
							class="-ml-2 h-6 w-6 shrink-0 rounded-full"
						/>

						<p class="grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
							{recipient.displayName.value || recipient.handle.value}
						</p>
					</>
				);
			})()}
		</div>
	);
};

export default ChannelHeader;
