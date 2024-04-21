import { type Signal, For, createSignal, batch, createEffect } from 'solid-js';

import {
	type KeywordFilterMatcher,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
} from '~/api/moderation';

import { formatAbsDateTime } from '~/utils/intl/time';
import { createRadioModel, model } from '~/utils/input';
import { getUniqueId } from '~/utils/misc';

import { openModal } from '~/com/globals/modals';
import { bustModeration } from '~/com/globals/shared';

import { preferences } from '../../../../globals/settings';

import { BoxedIconButton } from '~/com/primitives/boxed-icon-button';
import { Button } from '~/com/primitives/button';
import { IconButton } from '~/com/primitives/icon-button';
import { Input } from '~/com/primitives/input';
import { Interactive } from '~/com/primitives/interactive';
import {
	ListBox,
	ListBoxItemInteractive,
	ListBoxItemReadonly,
	ListGroup,
	ListGroupHeader,
} from '~/com/primitives/list-box';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';
import Radio from '~/com/components/inputs/Radio';

import AddIcon from '~/com/icons/baseline-add';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import DeleteIcon from '~/com/icons/baseline-delete';
import FormatLetterMatchesIcon from '~/com/icons/baseline-format-letter-matches';

import { type ViewParams, VIEW_KEYWORD_FILTER_FORM, VIEW_KEYWORD_FILTERS, useViewRouter } from '../_router';

type KeywordState = [keyword: Signal<string>, whole: Signal<boolean>];

const wholeMatchBtn = Interactive({
	class: `absolute inset-y-0 right-0 grid w-9 place-items-center text-base`,
});

const createKeywordState = (keyword: string, whole: boolean): KeywordState => {
	return [createSignal(keyword), createSignal(whole)];
};

const KeywordFilterFormView = () => {
	let dateInput: HTMLInputElement;

	const router = useViewRouter();
	const params = router.current as ViewParams<typeof VIEW_KEYWORD_FILTER_FORM>;

	const filters = preferences.moderation.keywords;
	const conf = filters.find((filter) => filter.id === params.id);

	const id = getUniqueId();

	const [name, setName] = createSignal(conf ? conf.name : '');
	const [pref, setPref] = createSignal(conf ? conf.pref : PreferenceWarn);
	const [noFollows, setNoFollows] = createSignal(conf ? conf.noFollows : false);

	const [expiresAt, setExpiresAt] = createSignal(conf?.expires ? new Date(conf.expires) : undefined);

	const [matchers, setMatchers] = createSignal<KeywordState[]>(
		conf ? conf.matchers.map((m) => createKeywordState(m[0], m[1])) : [createKeywordState('', true)],
	);

	const prefModel = createRadioModel(pref, setPref);
	const noFollowModel = createRadioModel(noFollows, setNoFollows);

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
					<label class={ListGroupHeader}>Filter preference</label>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Disable this filter</span>
							<Radio ref={prefModel(PreferenceIgnore)} name={id + 'p'} />
						</label>

						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Cover posts behind warning</span>
							<Radio ref={prefModel(PreferenceWarn)} name={id + 'p'} />
						</label>

						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Hide posts entirely</span>
							<Radio ref={prefModel(PreferenceHide)} name={id + 'p'} />
						</label>
					</div>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">From everyone</span>
							<Radio ref={noFollowModel(false)} name={id + 'f'} />
						</label>

						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">From people I don't follow</span>
							<Radio ref={noFollowModel(true)} name={id + 'f'} />
						</label>
					</div>

					<div class={ListBox}>
						<button
							disabled={pref() === PreferenceIgnore}
							type="button"
							onClick={() => dateInput!.showPicker()}
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
							<input
								ref={(node) => {
									dateInput = node;
									modelDate(expiresAt, setExpiresAt)(node);
								}}
								type="datetime-local"
								min={getISOLocalString(new Date())}
								tabindex={-1}
								class="invisible absolute inset-0"
							/>
						</button>
					</div>
				</div>

				<div class="flex flex-col gap-3">
					<label class={ListGroupHeader}>Phrases</label>

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
										class={Input()}
										style="padding-right: 64px"
									/>

									<button
										type="button"
										title={`Match the whole word`}
										aria-pressed={whole()}
										onClick={() => setWhole(!whole())}
										class={wholeMatchBtn}
									>
										<FormatLetterMatchesIcon class={!whole() ? `text-muted-fg` : `text-accent`} />
									</button>
								</div>

								<button
									type="button"
									title="Remove this phrase"
									onClick={() => {
										setMatchers(matchers().toSpliced(index(), 1));
									}}
									class={/* @once */ BoxedIconButton()}
								>
									<DeleteIcon />
								</button>
							</div>
						)}
					</For>

					<button
						type="button"
						onClick={() => setMatchers([...matchers(), createKeywordState('', true)])}
						class={/* @once */ Button({ variant: 'outline', class: 'self-start' })}
					>
						<AddIcon class="-ml-1 mr-2 text-lg" />
						<span>Add phrase</span>
					</button>
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

const getISOLocalString = (date: Date): string => {
	return date.toLocaleString('sv', { dateStyle: 'short', timeStyle: 'short' }).replace(' ', 'T');
};

const modelDate = (getter: () => Date | undefined, setter: (next: Date | undefined) => void) => {
	return (node: HTMLInputElement) => {
		createEffect(() => {
			const inst = getter();

			node.value = inst !== undefined ? getISOLocalString(inst) : '';
		});

		node.addEventListener('input', () => {
			const value = node.value;

			if (value === '') {
				setter(undefined);
			} else {
				const [year, month, date, hour, minute] = value.split(/[-T:]/g);
				const inst = new Date(+year, +month - 1, +date, +hour, +minute);

				setter(inst);
			}
		});
	};
};

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
