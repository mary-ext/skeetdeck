import { For, type JSX, createMemo, createSignal } from 'solid-js';

import { preferences } from '~/desktop/globals/settings';

import { model } from '~/utils/input';
import { getNativeLanguageName, languageNames, languageNamesStrict } from '~/utils/intl/display-names';
import { CODE2S } from '~/utils/intl/languages';

import { IconButton } from '~/com/primitives/icon-button';

import SearchInput from '~/com/components/inputs/SearchInput';

import AddIcon from '~/com/icons/baseline-add';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import DeleteIcon from '~/com/icons/baseline-delete';

import { useViewRouter } from '../_router';

const ExcludedTranslationView = () => {
	const router = useViewRouter();

	const [search, setSearch] = createSignal('');

	const normalizedSearch = createMemo(() => search().trim().toLowerCase());

	const exclusions = preferences.translation.exclusions;

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

				<h2 class="grow text-base font-bold">Never offer to translate these languages</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto pt-3">
				<For each={exclusions}>
					{(code, index) => (
						<div class="mx-4 flex min-w-0 items-center justify-between gap-4 pb-3">
							<div>
								<p class="text-sm">{/* @once */ languageNames.of(code)}</p>
								<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
							</div>
							<button
								title={`Remove this language`}
								onClick={() => {
									exclusions.splice(index(), 1);
								}}
								class={/* @once */ IconButton({ edge: 'right' })}
							>
								<DeleteIcon />
							</button>
						</div>
					)}
				</For>

				{(() => {
					if (exclusions.length === 0) {
						return (
							<div class="grid h-13 shrink-0 place-items-center pb-1 text-sm text-muted-fg">
								No languages excluded.
							</div>
						);
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
						if (exclusions.includes(code)) {
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
										exclusions.push(code);
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

export default ExcludedTranslationView;
