import { preferences } from '~/desktop/globals/settings.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import Checkbox from '~/com/components/inputs/Checkbox.tsx';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';

import { ViewType, useViewRouter } from './_router.tsx';

const selectItem = Interactive({
	class: `px-4 py-3 text-left text-sm`,
});

const LanguageView = () => {
	const router = useViewRouter();

	const langs = preferences.language;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 px-4">
				<h2 class="grow text-base font-bold">Language</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<button class={selectItem}>
					<p>Default post language</p>
					<p class="text-de text-muted-fg">Primary system language (English)</p>
				</button>

				<hr class="mx-4 mt-2 border-divider" />

				<p class="p-4 text-base font-bold leading-5">Content languages</p>

				<p class="px-4 pb-3 text-de text-muted-fg">
					Controls which languages appears in your feeds, this does not apply to your following feed. Removing
					all languages reveals posts from all languages.
				</p>

				<div class="px-4 py-3">
					<label class="flex min-w-0 justify-between gap-4">
						<span class="text-sm">Show unspecified posts</span>

						<Checkbox
							checked={langs.allowUnspecified}
							onChange={(ev) => {
								const next = ev.target.checked;
								langs.allowUnspecified = next;
							}}
						/>
					</label>

					<p class="mr-6 text-de text-muted-fg">Do not filter posts that does not specify a language.</p>
				</div>

				<div class="px-4 py-3">
					<label class="flex justify-between gap-4">
						<span class="text-sm">Use system languages</span>
						<Checkbox
							checked={langs.useSystemLanguages}
							onChange={(ev) => {
								const next = ev.target.checked;
								langs.useSystemLanguages = next;
							}}
						/>
					</label>

					<p class="mr-6 text-de text-muted-fg">
						Use the languages detected from your system or browser preferences
					</p>
				</div>

				<button
					onClick={() => router.move({ type: ViewType.ADDITIONAL_LANGUAGE })}
					class={`${selectItem} flex items-center justify-between gap-4`}
				>
					<div>
						<p>Additional content languages</p>
						<p class="text-de text-muted-fg">
							{(() => {
								const count = langs.languages.length;

								if (count === 1) {
									return `${count} language added`;
								}

								return `${count} languages added`;
							})()}
						</p>
					</div>

					<ChevronRightIcon class="text-xl text-muted-fg" />
				</button>
			</div>
		</div>
	);
};

export default LanguageView;
