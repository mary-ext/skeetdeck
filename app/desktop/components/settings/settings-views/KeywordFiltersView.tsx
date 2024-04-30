import { For } from 'solid-js';

import { PreferenceHide, PreferenceIgnore, PreferenceWarn } from '~/api/moderation';

import { preferences } from '~/desktop/globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import AddIcon from '~/com/icons/baseline-add';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import { VIEW_KEYWORD_FILTER_FORM, useViewRouter } from './_router';
import { ListBox, ListBoxItemChevron, ListBoxItemInteractive } from '~/com/primitives/list-box';

const KeywordFiltersView = () => {
	const router = useViewRouter();

	const filters = preferences.moderation.keywords;

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

				<h2 class="grow text-base font-bold">Keyword filters</h2>

				<button
					title="Add new keyword filter"
					onClick={() => router.to({ type: VIEW_KEYWORD_FILTER_FORM, id: undefined })}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<AddIcon />
				</button>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				{filters.length === 0 ? (
					<div class="text-center text-sm text-muted-fg">No keyword filters added.</div>
				) : (
					<div class={ListBox}>
						<For each={filters}>
							{(filter) => {
								return (
									<button
										onClick={() => router.to({ type: VIEW_KEYWORD_FILTER_FORM, id: filter.id })}
										class={ListBoxItemInteractive}
									>
										<div class="grow">
											<p class="font-bold">{filter.name}</p>
											<p class="text-de text-muted-fg">
												<span>
													{(() => {
														const count = filter.matchers.length;

														if (count === 1) {
															return `${count} keyword muted`;
														} else {
															return `${count} keywords muted`;
														}
													})()}
												</span>
												<span class="px-1">·</span>
												<span>
													{(() => {
														const val = filter.pref;

														if (val === PreferenceIgnore) {
															return `Ignore`;
														}
														if (val === PreferenceWarn) {
															return `Warn`;
														}
														if (val === PreferenceHide) {
															return `Hide`;
														}
													})()}
												</span>
											</p>
										</div>

										<ChevronRightIcon class={ListBoxItemChevron} />
									</button>
								);
							}}
						</For>
					</div>
				)}
			</div>
		</div>
	);
};

export default KeywordFiltersView;
