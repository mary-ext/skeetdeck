import type { JSX } from 'solid-js';

import { systemLanguages } from '~/api/globals/platform.ts';

import { getNativeLanguageName, languageNames } from '~/utils/intl/display-names.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { preferences } from '~/desktop/globals/settings.ts';

import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout.tsx';

import CheckIcon from '~/com/icons/baseline-check.tsx';

import CustomPostLanguageDialog from '../dialogs/CustomPostLanguageDialog.tsx';

export interface PostLanguageActionProps {
	languages: string[];
	onChange: (next: string[]) => void;
	children: JSX.Element;
}

const getLanguageCodes = () => {
	let pref = preferences.language;
	let defaultLanguage = pref.defaultPostLanguage;

	let array = [];

	if (defaultLanguage === 'system') {
		array.push(systemLanguages[0]);
	} else if (defaultLanguage !== 'none') {
		array.push(defaultLanguage);
	}

	if (pref.useSystemLanguages) {
		array = array.concat(systemLanguages);
	}

	return [...new Set(array.concat(pref.languages))];
};

const PostLanguageAction = (props: PostLanguageActionProps) => {
	return (
		<Flyout button={props.children} placement="bottom" middleware={offsetlessMiddlewares}>
			{({ close, menuProps }) => {
				const languages = getLanguageCodes();

				const onChange = props.onChange;

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="p-4 text-sm">
							<p class="font-bold">Post language</p>
							<p class="text-muted-fg">What languages are you using for this post?</p>
						</div>

						<div class="flex grow flex-col overflow-y-auto">
							{
								/* @once  */ languages.map((code) => (
									<button
										onClick={() => {
											close();
											onChange([code]);
										}}
										class={/* @once */ MenuItem()}
									>
										<div class="grow">
											<p class="text-sm">{/* @once */ languageNames.of(code)}</p>
											<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
										</div>

										<CheckIcon
											class="text-xl text-accent"
											classList={{
												[`invisible`]: props.languages.length !== 1 || !props.languages.includes(code),
											}}
										/>
									</button>
								))
							}

							<button
								onClick={() => {
									close();

									openModal(() => (
										<CustomPostLanguageDialog languages={props.languages} onChange={onChange} />
									));
								}}
								class={/* @once */ MenuItem()}
							>
								<span class="grow">Custom</span>

								<CheckIcon
									class="text-xl text-accent"
									classList={{
										[`invisible`]:
											props.languages.length < 2 && props.languages.every((code) => languages.includes(code)),
									}}
								/>
							</button>
						</div>
					</div>
				);
			}}
		</Flyout>
	);
};

export default PostLanguageAction;
