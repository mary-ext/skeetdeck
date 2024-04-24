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

import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import { VIEW_ADDITIONAL_LANGUAGE, VIEW_EXCLUDED_TRANSLATION, useViewRouter } from './_router';

import { type SelectOption, SelectionItem } from './_components';

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
						<SelectionItem
							title="Post language"
							value={langs.defaultPostLanguage}
							options={getLanguageOptions(false)}
							onChange={(next) => (langs.defaultPostLanguage = next)}
						/>

						<SelectionItem
							title="Who can reply to my posts"
							value={ui.defaultReplyGate}
							options={getReplyGateOptions()}
							onChange={(next) => (ui.defaultReplyGate = next)}
						/>
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
						<SelectionItem
							title="Translate to"
							value={trans.to}
							options={getLanguageOptions(true)}
							onChange={(next) => (trans.to = next)}
						/>

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

const getLanguageOptions = (isTranslate: boolean) => {
	const system = languageNames.of(systemLanguages[0]);

	const options: SelectOption<string>[] = [
		{
			value: 'none',
			label: !isTranslate ? `None` : `Disabled`,
		},
		{
			value: 'system',
			short: `System default (${system})`,
			get label() {
				return (
					<>
						<p>System default</p>
						<p class="text-de text-muted-fg">{system}</p>
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
				short: eng,
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

	return options;
};

const getReplyGateOptions = () => {
	const options: SelectOption<'e' | 'm' | 'f'>[] = [
		{
			value: 'e',
			label: `Everyone`,
		},
		{
			value: 'm',
			label: `Mentioned users only`,
		},
		{
			value: 'f',
			label: `Followed users only`,
		},
	];

	return options;
};
