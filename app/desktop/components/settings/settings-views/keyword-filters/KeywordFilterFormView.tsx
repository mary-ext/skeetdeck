import { type Signal, For, batch, createSignal, onMount } from 'solid-js';

import {
	type KeywordFilterMatcher,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
	type KeywordPreference,
} from '~/api/moderation';

import { formatAbsDateTime } from '~/utils/intl/time';
import { model, refs } from '~/utils/input';

import { openModal } from '~/com/globals/modals';
import { bustModeration } from '~/com/globals/shared';

import { preferences } from '../../../../globals/settings';

import { Button } from '~/com/primitives/button';
import { IconButton } from '~/com/primitives/icon-button';
import { Input } from '~/com/primitives/input';
import {
	ListBox,
	ListBoxItem,
	ListBoxItemInteractive,
	ListGroup,
	ListGroupHeader,
} from '~/com/primitives/list-box';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';

import DateTimeDialog from '~/desktop/components/dialogs/DateTimeDialog';

import AddIcon from '~/com/icons/baseline-add';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import CloseIcon from '~/com/icons/baseline-close';
import FormatLetterMatchesIcon from '~/com/icons/baseline-format-letter-matches';

import { type ViewParams, VIEW_KEYWORD_FILTER_FORM, VIEW_KEYWORD_FILTERS, useViewRouter } from '../_router';

import { SelectionItem } from '../_components';

type KeywordState = [keyword: Signal<string>, whole: Signal<boolean>];

const createKeywordState = (keyword: string, whole: boolean): KeywordState => {
	return [createSignal(keyword), createSignal(whole)];
};

const KeywordFilterFormView = () => {
	let canAutofocus = false;

	const router = useViewRouter();
	const params = router.current as ViewParams<typeof VIEW_KEYWORD_FILTER_FORM>;

	const filters = preferences.moderation.keywords;
	const conf = filters.find((filter) => filter.id === params.id);

	const [name, setName] = createSignal(conf ? conf.name : '');
	const [pref, setPref] = createSignal(conf ? conf.pref : PreferenceWarn);
	const [noFollows, setNoFollows] = createSignal(conf ? conf.noFollows : false);

	const [expiresAt, setExpiresAt] = createSignal(conf?.expires ? new Date(conf.expires) : undefined);

	const [matchers, setMatchers] = createSignal<KeywordState[]>(
		conf ? conf.matchers.map((m) => createKeywordState(m[0], m[1])) : [createKeywordState('', true)],
	);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();

		batch(() => {
			const $name = name();
			const $pref = pref();
			const $expiresAt = expiresAt();
			const $matchers = matchers().map<KeywordFilterMatcher>(([kw, whole]) => [kw[0](), whole[0]()]);
			const $noFollows = noFollows();
			const $match = createRegexMatcher($matchers);

			if (conf) {
				conf.name = $name;
				conf.pref = $pref;
				conf.expires = $pref !== PreferenceIgnore ? $expiresAt?.getTime() : undefined;
				conf.match = $match;
				conf.noFollows = $noFollows;
				conf.matchers = $matchers;
			} else {
				filters.push({
					id: '' + Date.now(),

					name: $name,
					pref: $pref,
					expires: $pref !== PreferenceIgnore ? $expiresAt?.getTime() : undefined,
					match: $match,
					noFollows: $noFollows,
					matchers: $matchers,
				});
			}

			bustModeration();
			router.move({ type: VIEW_KEYWORD_FILTERS });
		});
	};

	onMount(() => {
		canAutofocus = true;
	});

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

			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<label class={ListGroupHeader}>Filter name</label>
					<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
				</div>

				<div class={ListGroup}>
					<label class={ListGroupHeader}>Preferences</label>

					<div class={ListBox}>
						<SelectionItem<KeywordPreference>
							title="Action to perform"
							value={pref()}
							onChange={setPref}
							options={[
								{ value: PreferenceIgnore, label: `Disabled` },
								{ value: PreferenceWarn, label: `Cover behind warning` },
								{ value: PreferenceHide, label: `Hide completely` },
							]}
						/>

						<button
							disabled={pref() === PreferenceIgnore}
							type="button"
							onClick={() =>
								openModal(() => (
									<DateTimeDialog value={expiresAt()} minDate={new Date()} onChange={setExpiresAt} />
								))
							}
							class={ListBoxItemInteractive + ' relative'}
						>
							<span class="grow font-medium">Expire after</span>
							<span class="text-de text-muted-fg">
								{(() => {
									const date = expiresAt();

									if (date) {
										return formatAbsDateTime(date.getTime());
									}

									return `Never`;
								})()}
							</span>
						</button>

						<SelectionItem<boolean>
							title="Match posts from"
							value={noFollows()}
							onChange={setNoFollows}
							options={[
								{ value: false, label: `Everyone` },
								{ value: true, label: `People I don't follow` },
							]}
						/>
					</div>
				</div>

				<div class={ListGroup}>
					<label class={ListGroupHeader}>Phrases</label>

					<div class={ListBox}>
						<For
							each={matchers()}
							fallback={
								<div class={ListBoxItem}>
									<p class="text-de text-muted-fg">No phrases added yet.</p>
								</div>
							}
						>
							{([[keyword, setKeyword], [whole, setWhole]], index) => (
								<div class="flex gap-2 px-2 py-1.5">
									<input
										ref={refs<HTMLInputElement>(model(keyword, setKeyword), (node) => {
											if (canAutofocus) {
												onMount(() => node.focus());
											}
										})}
										type="text"
										required
										placeholder="A phrase, word, or tag..."
										class="grow rounded bg-transparent px-2 py-1.5 text-sm text-primary outline-2 outline-accent outline-none placeholder:text-muted-fg focus:outline"
									/>

									<div class="flex">
										<button
											type="button"
											title="Match the whole word"
											aria-pressed={whole()}
											onClick={() => setWhole(!whole())}
											class={/* @once */ IconButton()}
										>
											<FormatLetterMatchesIcon class={!whole() ? `text-muted-fg` : `text-accent`} />
										</button>
										<button
											type="button"
											title="Remove this phrase"
											disabled={matchers().length === 1}
											onClick={() => setMatchers(matchers().toSpliced(index(), 1))}
											class={/* @once */ IconButton()}
										>
											<CloseIcon />
										</button>
									</div>
								</div>
							)}
						</For>

						<button
							type="button"
							onClick={() => setMatchers([...matchers(), createKeywordState('', true)])}
							class={ListBoxItemInteractive}
						>
							<AddIcon class="w-8 shrink-0 text-lg text-muted-fg" />
							<span class="grow font-medium">Add new phrase</span>
						</button>
					</div>
				</div>

				{conf && (
					<div class={ListGroup}>
						<div class={ListBox}>
							<button
								type="button"
								onClick={() => {
									openModal(() => (
										<ConfirmDialog
											title={`Delete this keyword filter?`}
											body={
												<>
													Are you sure you want to delete{' '}
													<span class="font-bold">{/* @once */ conf.name}</span>? This will affect posts that
													were previously hidden by this keyword filter.
												</>
											}
											confirmation={`Delete`}
											onConfirm={() => {
												batch(() => {
													const index = filters.findIndex((filter) => filter.id === params.id);

													if (index !== -1) {
														filters.splice(index, 1);
													}

													bustModeration();
													router.move({ type: VIEW_KEYWORD_FILTERS });
												});
											}}
										/>
									));
								}}
								class={ListBoxItemInteractive}
							>
								<span class="font-medium text-red-400">Delete filter</span>
							</button>
						</div>
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

export const createRegexMatcher = (matchers: KeywordFilterMatcher[]) => {
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
