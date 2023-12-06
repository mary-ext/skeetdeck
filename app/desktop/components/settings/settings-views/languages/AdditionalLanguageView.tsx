import { For, JSX, createMemo, createSignal } from 'solid-js';

import { systemLanguages } from '~/api/globals/platform.ts';

import { getNativeLanguageName, languageNames, languageNamesStrict } from '~/utils/intl/display-names.ts';
import { CODE2S } from '~/utils/intl/languages.ts';
import { model } from '~/utils/input.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import SearchInput from '~/com/components/inputs/SearchInput.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import DeleteIcon from '~/com/icons/baseline-delete.tsx';

import { VIEW_LANGAUGE, useViewRouter } from '../_router.tsx';

const AdditionalLanguageView = () => {
	const router = useViewRouter();

	const [search, setSearch] = createSignal('');

	const normalizedSearch = createMemo(() => search().trim().toLowerCase());

	const langs = preferences.language;
	const languages = langs.languages;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={() => router.move({ type: VIEW_LANGAUGE })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Additional content languages</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto pt-3">
				{(() => {
					if (!langs.useSystemLanguages) {
						return;
					}

					return systemLanguages.map((code) => (
						<div class="mx-4 pb-3">
							<p class="flex items-center text-sm">
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">
									{/* @once */ languageNames.of(code)}
								</span>
								<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
									System
								</span>
							</p>
							<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
						</div>
					));
				})()}

				<For each={languages}>
					{(code, index) => (
						<div class="mx-4 flex min-w-0 items-center justify-between gap-4 pb-3">
							<div>
								<p class="text-sm">{/* @once */ languageNames.of(code)}</p>
								<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
							</div>
							<button
								title={`Remove this language`}
								onClick={() => {
									languages.splice(index(), 1);
								}}
								class={/* @once */ IconButton({ edge: 'right' })}
							>
								<DeleteIcon />
							</button>
						</div>
					)}
				</For>

				{(() => {
					if (languages.length === 0 && (!langs.useSystemLanguages || systemLanguages.length === 0)) {
						return <div class="grid place-items-center pb-3 text-sm text-muted-fg">No languages added.</div>;
					}
				})()}

				<hr class="mx-4 mt-2 border-divider" />

				<div class="p-4">
					<SearchInput ref={model(search, setSearch)} />
				</div>

				{CODE2S.map((code) => {
					const eng = languageNamesStrict.of(code);
					const native = getNativeLanguageName(code);

					if (!eng || !native) {
						return;
					}

					const lowerEng = eng.toLowerCase();
					const lowerNative = native.toLowerCase();

					return (() => {
						if (languages.includes(code) || (langs.useSystemLanguages && systemLanguages.includes(code))) {
							return;
						}

						const $search = normalizedSearch();
						if ($search && !lowerEng.includes($search) && !lowerNative.includes($search)) {
							return;
						}

						return (
							<div class="mx-4 flex min-w-0 items-center justify-between gap-4 pb-3">
								<div>
									<p class="text-sm">{eng}</p>
									<p class="text-de text-muted-fg">{native}</p>
								</div>
								<button
									title={`Add this language`}
									onClick={() => {
										languages.push(code);
									}}
									class={/* @once */ IconButton({ edge: 'right' })}
								>
									<AddIcon />
								</button>
							</div>
						);
					}) as unknown as JSX.Element;
				})}
			</div>
		</div>
	);
};

export default AdditionalLanguageView;
