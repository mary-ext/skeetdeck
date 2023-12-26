import { createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import { systemLanguages } from '~/api/globals/platform.ts';
import type { TranslationPreferences } from '~/api/types.ts';

import { getTranslation, getTranslationKey } from '~/api/queries/get-translation.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { Button } from '../../../primitives/button.ts';

import CircularProgress from '../../CircularProgress.tsx';
import { useSharedPreferences } from '../../SharedPreferences.tsx';
import { languageNames } from '~/utils/intl/display-names.ts';

export interface PostTranslationProps {
	post: SignalizedPost;
}

export const needTranslation = (post: SignalizedPost, prefs: TranslationPreferences) => {
	const $record = post.record.value;
	const langs = $record.langs;

	if (!langs || !$record.text || langs.length < 1) {
		return false;
	}

	const preferred = prefs.to;

	if (preferred === 'none') {
		return false;
	}

	const preferredLang = preferred === 'system' ? systemLanguages[0] : preferred;
	const exclusions = prefs.exclusions;

	const unknowns = langs.filter(
		(code) => code !== preferredLang && (!exclusions || !exclusions.includes(code)),
	);

	return unknowns.length > 0;
};

export const getPreferredLanguage = (prefs: TranslationPreferences) => {
	const preferred = prefs.to;

	const preferredLang = preferred === 'system' || preferred === 'none' ? systemLanguages[0] : preferred;
	return preferredLang;
};

const PostTranslation = (props: PostTranslationProps) => {
	const { translation } = useSharedPreferences();

	const [source, _setSource] = createSignal('auto');
	const target = getPreferredLanguage(translation);

	const text = () => props.post.record.value.text;

	const trans = createQuery(() => ({
		queryKey: getTranslationKey(source(), target, text()),
		queryFn: getTranslation,
	}));

	return (
		<div class="mt-3">
			{(() => {
				if (trans.isLoading) {
					return (
						<div class="grid place-items-center p-2">
							<CircularProgress />
						</div>
					);
				}

				if (trans.isError) {
					return (
						<div class="flex flex-col items-center gap-2 p-2">
							<p class="text-center text-sm text-muted-fg">Unable to retrieve translation</p>

							<div>
								<button onClick={() => trans.refetch()} class={/* @once */ Button({ variant: 'primary' })}>
									Retry
								</button>
							</div>
						</div>
					);
				}

				if (trans.isSuccess) {
					const data = trans.data;

					const sources = data.sources.map((code) => languageNames.of(code)).join(', ');
					const auto = source() === 'auto';

					return (
						<>
							<p class="text-sm text-muted-fg">{`Translated from ${sources}${auto ? ' (detected)' : ''}`}</p>
							<p class="whitespace-pre-wrap break-words text-base">{/* @once */ data.result}</p>
						</>
					);
				}
			})()}
		</div>
	);
};

export default PostTranslation;
