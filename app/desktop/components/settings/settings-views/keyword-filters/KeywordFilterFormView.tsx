import { type Signal, For, createSignal, batch } from 'solid-js';

import {
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
	type KeywordPreference,
} from '~/api/moderation/enums.ts';
import type { ModerationFilterKeywordOpts } from '~/api/moderation/types.ts';

import { createRadioModel, model } from '~/utils/input.ts';
import { getUniqueId } from '~/utils/misc.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import Radio from '~/com/components/inputs/Radio.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import DeleteIcon from '~/com/icons/baseline-delete.tsx';
import FormatLetterMatchesIcon from '~/com/icons/baseline-format-letter-matches.tsx';

import {
	type ViewParams,
	VIEW_KEYWORD_FILTER_FORM,
	VIEW_KEYWORD_FILTERS,
	useViewRouter,
} from '../_router.tsx';
import { openModal } from '~/com/globals/modals.tsx';
import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';

type KeywordState = [keyword: Signal<string>, whole: Signal<boolean>];

const wholeMatchBtn = Interactive({
	class: `absolute inset-y-0 right-0 ml-px grid place-items-center rounded-r-md px-2`,
});

const createKeywordState = (keyword: string, whole: boolean): KeywordState => {
	return [createSignal(keyword), createSignal(whole)];
};

const KeywordFilterFormView = () => {
	const router = useViewRouter();
	const params = router.current as ViewParams<typeof VIEW_KEYWORD_FILTER_FORM>;

	const filters = preferences.moderation.keywords;
	const conf = filters.find((filter) => filter.id === params.id);

	const id = getUniqueId();

	const [name, setName] = createSignal(conf ? conf.name : '');
	const [pref, setPref] = createSignal(conf ? '' + conf.pref : '2');

	const [matchers, setMatchers] = createSignal<KeywordState[]>(
		conf ? conf.matchers.map((m) => createKeywordState(m[0], m[1])) : [createKeywordState('', true)],
	);

	const prefModel = createRadioModel(pref, setPref);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();

		batch(() => {
			const $name = name();
			const $pref = +pref() as KeywordPreference;
			const $matchers = matchers().map<ModerationFilterKeywordOpts>(([kw, whole]) => [kw[0](), whole[0]()]);
			const $match = createRegexMatcher($matchers);

			if (conf) {
				conf.name = $name;
				conf.pref = $pref;
				conf.match = $match;
				conf.matchers = $matchers;
			} else {
				filters.push({
					id: '' + Date.now(),

					name: $name,
					pref: $pref,
					match: $match,
					matchers: $matchers,
				});
			}

			router.move({ type: VIEW_KEYWORD_FILTERS });
		});
	};

	return (
		<form onSubmit={handleSubmit} class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					type="button"
					title="Return to previous screen"
					onClick={() => router.move({ type: VIEW_KEYWORD_FILTERS })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">{conf ? `Edit` : `Add`} keyword filter</h2>

				<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
					Save
				</button>
			</div>

			<div class="flex grow flex-col overflow-y-auto">
				<label class="mx-4 mt-4 block">
					<span class="mb-2 block text-sm font-medium leading-6 text-primary">Filter name</span>
					<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
				</label>

				<div class="mt-4 flex flex-col gap-3 px-4 py-3 text-sm">
					<p class="font-medium leading-6 text-primary">Filter preference</p>

					<label class="flex items-center justify-between gap-2">
						<span>Disable filter for now</span>
						<Radio ref={prefModel('' + PreferenceIgnore)} name={id} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Hide posts behind a warning</span>
						<Radio ref={prefModel('' + PreferenceWarn)} name={id} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Remove posts completely</span>
						<Radio ref={prefModel('' + PreferenceHide)} name={id} />
					</label>
				</div>

				<div class="mt-4 flex flex-col gap-3 px-4">
					<p class="text-sm font-medium leading-6 text-primary">Phrases</p>

					<For
						each={matchers()}
						fallback={<p class="flex h-9 items-center text-sm text-muted-fg">No phrases added</p>}
					>
						{([[keyword, setKeyword], [whole, setWhole]], index) => (
							<div class="flex min-w-0 items-center gap-3">
								<div class="relative grow">
									<input
										ref={model(keyword, setKeyword)}
										type="text"
										required
										class={/* @once */ Input({ class: 'pr-8' })}
									/>

									<button
										type="button"
										title={`Match the whole word`}
										aria-pressed={whole()}
										onClick={() => setWhole(!whole())}
										class={wholeMatchBtn}
									>
										<FormatLetterMatchesIcon
											class={`text-lg ${!whole() ? `text-muted-fg` : `text-accent`}`}
										/>
									</button>
								</div>

								<button
									type="button"
									title="Remove this phrase"
									onClick={() => {
										const next = matchers().slice();
										next.splice(index(), 1);

										setMatchers(next);
									}}
									class={/* @once */ Button({ variant: 'outline' })}
								>
									<DeleteIcon class="-mx-1.5 text-lg" />
								</button>
							</div>
						)}
					</For>

					<button
						type="button"
						onClick={() => setMatchers([...matchers(), createKeywordState('', true)])}
						class={/* @once */ Button({ variant: 'outline', class: 'self-start' })}
					>
						<AddIcon class="-ml-1.5 mr-2 text-lg" />
						<span>Add phrase</span>
					</button>
				</div>

				{conf && (
					<div class="contents">
						<div class="mx-4 mt-4 grow border-b border-divider"></div>

						<button
							type="button"
							onClick={() => {
								openModal(() => (
									<ConfirmDialog
										title={`Delete this keyword filter?`}
										body={
											<>
												Are you sure you want to delete <span class="font-bold">{/* @once */ conf.name}</span>
												? This will affect posts that were previously hidden by this keyword filter.
											</>
										}
										confirmation={`Delete`}
										onConfirm={() => {
											batch(() => {
												const index = filters.findIndex((filter) => filter.id === params.id);

												if (index !== -1) {
													filters.splice(index, 1);
												}

												router.move({ type: VIEW_KEYWORD_FILTERS });
											});
										}}
									/>
								));
							}}
							class={
								/* @once */ Interactive({
									variant: 'danger',
									class: `p-4 text-sm text-red-500 disabled:opacity-50`,
								})
							}
						>
							Delete filter
						</button>
					</div>
				)}
			</div>
		</form>
	);
};

export default KeywordFilterFormView;

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
const escape = (str: string) => {
	return str.replace(ESCAPE_RE, '\\$&');
};

const WORD_START_RE = /^[\p{M}\p{L}\p{N}\p{Pc}]/u;
const WORD_END_RE = /[\p{M}\p{L}\p{N}\p{Pc}]$/u;

export const createRegexMatcher = (matchers: ModerationFilterKeywordOpts[]) => {
	let str = '';

	let pfx = '';
	let sfx = '';

	for (let i = 0, l = matchers.length; i < l; i++) {
		const [keyword, whole] = matchers[i];

		str && (str += '|');

		if (whole) {
			pfx = WORD_START_RE.test(keyword) ? '\\b' : '';
			sfx = WORD_END_RE.test(keyword) ? '\\b' : '';

			str += pfx + escape(keyword) + sfx;
		} else {
			str += escape(keyword);
		}
	}

	return str;
};
