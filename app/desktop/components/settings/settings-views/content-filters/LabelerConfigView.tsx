import { preferences } from '~/desktop/globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';

import { VIEW_SUBSCRIBED_LABELERS, useViewRouter } from '../_router';

const LabelerConfigView = () => {
	const router = useViewRouter();

	// @ts-expect-error
	const _mods = preferences.moderation;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={() => router.move({ type: VIEW_SUBSCRIBED_LABELERS })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<div class="grow">
					<h2 class="text-base font-bold leading-5">Label provider preferences</h2>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg empty:hidden">
						@moderation.bsky.social
					</p>
				</div>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<p class="px-4 py-3 text-de text-muted-fg empty:hidden">
					These preferences applies to any content that has been labeled by this label provider.
				</p>
			</div>
		</div>
	);
};

export default LabelerConfigView;
