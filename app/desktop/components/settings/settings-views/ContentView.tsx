import { systemLanguages } from '~/api/globals/platform';

import { getNativeLanguageName, languageNames, languageNamesStrict } from '~/utils/intl/display-names';
import { CODE2S } from '~/utils/intl/languages';
import { modelChecked } from '~/utils/input';
import { mapDefined } from '~/utils/misc';

import { preferences } from '~/desktop/globals/settings';

import {
	ListBox,
	ListBoxItemChevron,
	ListBoxItemInteractive,
	ListBoxItemReadonly,
	ListGroup,
	ListGroupBlurb,
	ListGroupHeader,
} from '~/com/primitives/list-box';

import Checkbox from '~/com/components/inputs/Checkbox';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import { VIEW_ADDITIONAL_LANGUAGE, VIEW_EXCLUDED_TRANSLATION, useViewRouter } from './_router';

import type { SelectItem } from '../../flyouts/SelectAction';
import SelectAction from '../../flyouts/SelectAction';

const getLanguageLabel = (code: string, isTranslate: boolean) => {
	if (code === 'none') {
		return !isTranslate ? 'None' : `Disabled`;
	}

	if (code === 'system') {
		return `System default (${languageNames.of(systemLanguages[0])})`;
	}

	const eng = languageNamesStrict.of(code);

	if (!eng) {
		return `Unknown (${code})`;
	}

	return eng;
};

const getReplyGateLabel = (code: 'e' | 'm' | 'f'): string => {
	if (code === 'm') {
		return `Mentioned users only`;
	}

	if (code === 'f') {
		return `Followed users only`;
	}

	return `Everyone`;
};

const getAvailableLanguages = (isTranslate: boolean) => {
	const availableLanguages: SelectItem<string>[] = [
		{
			value: 'none',
			label: !isTranslate ? `None` : `Disabled`,
		},
		{
			value: 'system',
			get label() {
				const lang = languageNames.of(systemLanguages[0]);

				return (
					<>
						<p>System default</p>
						<p class="text-de text-muted-fg">{lang}</p>
					</>
				);
			},
		},
		...mapDefined(CODE2S, (code) => {
			const eng = languageNamesStrict.of(code);
			const native = getNativeLanguageName(code);

			if (!eng || !native) {
				return;
			}

			return {
				value: code,
				get label() {
					return (
						<>
							<p>{eng}</p>
							<p class="text-de text-muted-fg">{native}</p>
						</>
					);
				},
			};
		}),
	];

	return availableLanguages;
};

const getReplyGateOptions = () => {
	const options: SelectItem<'e' | 'm' | 'f'>[] = [
		{
			value: 'e',
			label: getReplyGateLabel('e'),
		},
		{
			value: 'm',
			label: getReplyGateLabel('m'),
		},
		{
			value: 'f',
			label: getReplyGateLabel('f'),
		},
	];

	return options;
};

const LanguageView = () => {
	const router = useViewRouter();

	const ui = preferences.ui;
	const langs = preferences.language;
	const trans = preferences.translation;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Content</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<p class={ListGroupHeader}>Content you post</p>

					<div class={ListBox}>
						<SelectAction
							value={langs.defaultPostLanguage}
							options={getAvailableLanguages(false)}
							onChange={(next) => (langs.defaultPostLanguage = next)}
						>
							<button class={ListBoxItemInteractive}>
								<span class="grow font-medium">Post language</span>

								<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
									<span class="text-de">{getLanguageLabel(langs.defaultPostLanguage, false)}</span>
									<ArrowDropDownIcon class="-mr-1 text-base" />
								</span>
							</button>
						</SelectAction>

						<SelectAction
							value={ui.defaultReplyGate}
							options={getReplyGateOptions()}
							onChange={(next) => (ui.defaultReplyGate = next)}
						>
							<button class={ListBoxItemInteractive}>
								<span class="grow font-medium">Who can reply to my posts</span>

								<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
									<span class="text-de">{getReplyGateLabel(ui.defaultReplyGate)}</span>
									<ArrowDropDownIcon class="-mr-1 text-base" />
								</span>
							</button>
						</SelectAction>
					</div>

					<p class={ListGroupBlurb}>This will not affect existing posts.</p>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Content you see</p>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<div class="grow">
								<p class="font-medium">Use my system languages</p>
								<p class="text-de text-muted-fg">Show posts according to browser preferences</p>
							</div>

							<Checkbox
								ref={modelChecked(
									() => langs.useSystemLanguages,
									(next) => (langs.useSystemLanguages = next),
								)}
							/>
						</label>

						<button
							onClick={() => router.move({ type: VIEW_ADDITIONAL_LANGUAGE })}
							class={ListBoxItemInteractive}
						>
							<div class="grow">
								<p class="font-medium">Additional languages</p>
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

							<ChevronRightIcon class={ListBoxItemChevron} />
						</button>

						<label class={ListBoxItemReadonly}>
							<div class="grow">
								<p class="font-medium">Don't show undeclared posts</p>
								<p class="text-de text-muted-fg">Hide posts that hasn't declared what language it's in</p>
							</div>

							<Checkbox
								ref={modelChecked(
									() => !langs.allowUnspecified,
									(next) => (langs.allowUnspecified = !next),
								)}
							/>
						</label>
					</div>

					<p class={ListGroupBlurb}>Removing all languages will result in all posts being shown.</p>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Content translation</p>

					<div class={ListBox}>
						<SelectAction
							value={trans.to}
							options={getAvailableLanguages(true)}
							onChange={(next) => (trans.to = next)}
						>
							<button class={ListBoxItemInteractive}>
								<span class="grow font-medium">Translate to</span>

								<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
									<span class="text-de">{getLanguageLabel(trans.to, true)}</span>
									<ArrowDropDownIcon class="-mr-1 text-base" />
								</span>
							</button>
						</SelectAction>

						<button
							onClick={() => router.move({ type: VIEW_EXCLUDED_TRANSLATION })}
							class={ListBoxItemInteractive}
						>
							<div class="grow">
								<p class="font-medium">Exclude languages from translation</p>
								<p class="text-de text-muted-fg">
									{(() => {
										const count = trans.exclusions.length;

										if (count === 1) {
											return `${count} language excluded`;
										}

										return `${count} languages excluded`;
									})()}
								</p>
							</div>

							<ChevronRightIcon class={ListBoxItemChevron} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LanguageView;
