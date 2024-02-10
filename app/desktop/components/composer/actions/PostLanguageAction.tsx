import { batch, type JSX } from 'solid-js';

import { systemLanguages } from '~/api/globals/platform';

import { getNativeLanguageName, languageNames } from '~/utils/intl/display-names';
import { clsx } from '~/utils/misc';

import { openModal } from '~/com/globals/modals';

import { preferences } from '~/desktop/globals/settings';

import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import CheckIcon from '~/com/icons/baseline-check';

import CustomPostLanguageDialog from '../dialogs/CustomPostLanguageDialog';

export interface PostLanguageActionProps {
	languages: string[];
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
				const available = getLanguageCodes();
				const selected = props.languages;

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="p-4 text-sm">
							<p class="font-bold">Post language</p>
							<p class="text-muted-fg">What languages are you using for this post?</p>
						</div>

						<div class="flex grow flex-col overflow-y-auto">
							{
								/* @once  */ available.map((code) => (
									<button
										onClick={() => {
											close();

											batch(() => {
												selected.length = 0;
												selected.push(code);
											});
										}}
										class={/* @once */ MenuItem()}
									>
										<div class="grow">
											<p class="text-sm">{/* @once */ languageNames.of(code)}</p>
											<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
										</div>

										<CheckIcon
											class={clsx([
												`text-xl text-accent`,
												(props.languages.length !== 1 || !props.languages.includes(code)) && `invisible`,
											])}
										/>
									</button>
								))
							}

							<button
								onClick={() => {
									close();

									openModal(() => <CustomPostLanguageDialog languages={props.languages} />);
								}}
								class={/* @once */ MenuItem()}
							>
								<span class="grow">Custom</span>

								<CheckIcon
									class={clsx([
										`text-xl text-accent`,
										props.languages.length < 2 &&
											props.languages.every((code) => available.includes(code)) &&
											`invisible`,
									])}
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
