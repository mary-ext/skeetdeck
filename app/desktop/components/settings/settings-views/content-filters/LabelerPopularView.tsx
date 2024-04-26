import { For, Match, Switch } from 'solid-js';

import { createInfiniteQuery } from '@mary/solid-query';

import { getLabelerPopular, getLabelerPopularKey } from '~/api/queries/get-labeler-popular';

import { formatCompact } from '~/utils/intl/number';

import { IconButton } from '~/com/primitives/icon-button';
import { Interactive } from '~/com/primitives/interactive';
import { ListBox, ListBoxBlock, ListBoxItemInteractive } from '~/com/primitives/list-box';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import DefaultLabelerAvatar from '~/com/assets/default-labeler-avatar.svg?url';

import { VIEW_LABELER_CONFIG, useViewRouter } from '../_router';
import CircularProgress from '~/com/components/CircularProgress';

const listItem = Interactive({
	variant: 'muted',
	class: ListBoxBlock + ` flex min-w-0 flex-col items-stretch gap-2`,
});

const LabelerPopularView = () => {
	const router = useViewRouter();

	const popular = createInfiniteQuery(() => {
		return {
			queryKey: getLabelerPopularKey(),
			queryFn: getLabelerPopular,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={router.back}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Explore label providers</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div>
					{popular.isLoading && (
						<div class="grid place-items-center py-3">
							<CircularProgress />
						</div>
					)}

					<div class={ListBox + ` empty:hidden`}>
						<For each={popular.data?.pages.flatMap((page) => page.views)}>
							{(view) => {
								const profile = view.creator;

								return (
									<button
										onClick={() => router.to({ type: VIEW_LABELER_CONFIG, did: profile.did })}
										class={listItem}
									>
										<div class="flex items-center gap-3">
											<img
												src={/* @once */ profile.avatar || DefaultLabelerAvatar}
												class="mt-1 h-8 w-8 shrink-0 self-start rounded-md"
											/>

											<div class="flex min-w-0 grow flex-col text-sm">
												<p class="overflow-hidden text-ellipsis whitespace-nowrap font-medium empty:hidden">
													{/* @once */ profile.displayName}
												</p>
												<p class="flex overflow-hidden break-words text-de text-muted-fg">
													<span class="overflow-hidden text-ellipsis whitespace-nowrap">
														{/* @once */ '@' + profile.handle}
													</span>
													<span class="px-1">·</span>
													<span class="shrink-0">{/* @once */ formatCompact(view.likeCount || 0)} likes</span>
												</p>
											</div>

											<ChevronRightIcon class="mt-2.5 shrink-0 self-start text-xl text-muted-fg" />
										</div>

										<div class="line-clamp-2 whitespace-pre-wrap break-words text-de empty:hidden">
											{/* @once */ profile.description?.replace(/\n(?:.|\n)+$/, '')}
										</div>
									</button>
								);
							}}
						</For>

						<Switch>
							<Match when={popular.isFetchingNextPage}>
								<div class={ListBoxBlock + ` flex flex-col items-center`}>
									<CircularProgress />
								</div>
							</Match>

							<Match when={popular.hasNextPage}>
								<button onClick={() => popular.fetchNextPage()} class={ListBoxItemInteractive}>
									<span class="grow font-medium">Load more providers</span>
								</button>
							</Match>
						</Switch>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LabelerPopularView;
