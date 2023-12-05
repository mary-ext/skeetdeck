import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults.ts';

import { isElementClicked } from '~/utils/interaction.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import AddIcon from '~/com/icons/baseline-add.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';

import DefaultListAvatar from '~/com/assets/default-list-avatar.svg?url';

import { ViewType, useViewRouter } from '../_router.tsx';

const selectItem = Interactive({
	variant: 'muted',
	class: `flex cursor-pointer items-center gap-4 px-4 py-3`,
});

const SubscribedLabelersView = () => {
	const router = useViewRouter();

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={() => router.move({ type: ViewType.CONTENT_FILTERS })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Subscribed label providers</h2>

				<button
					disabled
					title="Add new label provider"
					onClick={() => {}}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<AddIcon />
				</button>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<p class="px-4 py-3 text-de text-muted-fg">
					Label providers are communities or entities aiming to provide curated social experiences by labeling
					the content that you see in Bluesky.
				</p>

				{(() => {
					const handleClick = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev)) {
							return;
						}

						router.move({ type: ViewType.LABEL_CONFIG, kind: 'labeler', did: DEFAULT_MODERATION_LABELER });
					};

					return (
						<div tabindex={0} onClick={handleClick} onKeyDown={handleClick} class={selectItem}>
							<img src={DefaultListAvatar} class="h-12 w-12 shrink-0 rounded-full" />

							<div class="flex grow flex-col text-sm">
								<p class="line-clamp-1 break-all font-bold empty:hidden">bsky.social Moderation Team</p>
								<span class="line-clamp-1 break-all text-muted-fg">@moderation.bsky.social</span>
							</div>
						</div>
					);
				})()}
			</div>
		</div>
	);
};

export default SubscribedLabelersView;
