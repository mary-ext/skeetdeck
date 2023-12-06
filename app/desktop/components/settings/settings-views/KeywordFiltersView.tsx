import { For } from 'solid-js';

import { PreferenceHide, PreferenceIgnore, PreferenceWarn } from '~/api/moderation/enums.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import AddIcon from '~/com/icons/baseline-add.tsx';

import { VIEW_KEYWORD_FILTER_FORM, useViewRouter } from './_router.tsx';

const selectItem = Interactive({
	variant: 'muted',
	class: `px-4 py-3 text-left text-sm`,
});

const KeywordFiltersView = () => {
	const router = useViewRouter();

	const filters = preferences.moderation.keywords;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Keyword filters</h2>

				<button
					title="Add new keyword filter"
					onClick={() => router.move({ type: VIEW_KEYWORD_FILTER_FORM, id: undefined })}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<AddIcon />
				</button>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<For
					each={filters}
					fallback={<p class="p-4 text-de text-muted-fg">You don't have any keyword filters set up yet.</p>}
				>
					{(filter) => {
						return (
							<button
								onClick={() => router.move({ type: VIEW_KEYWORD_FILTER_FORM, id: filter.id })}
								class={selectItem}
							>
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
							</button>
						);
					}}
				</For>
			</div>
		</div>
	);
};

export default KeywordFiltersView;
