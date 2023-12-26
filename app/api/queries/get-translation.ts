import type { QueryFunctionContext as QC } from '@pkg/solid-query';

const BASE_URL = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dj=1&source=input';

export const getTranslationKey = (source: string, target: string, text: string) => {
	return ['/getTranslation', source, target, text];
};
export const getTranslation = async (ctx: QC<ReturnType<typeof getTranslationKey>>) => {
	const [, source, target, text] = ctx.queryKey;

	const url = new URL(BASE_URL);
	const searchParams = url.searchParams;

	searchParams.set('sl', source);
	searchParams.set('tl', target);
	searchParams.set('q', text);

	const response = await fetch(url, { signal: ctx.signal });
	if (!response.ok) {
		throw new Error(`Response error ${response.status}`);
	}

	const body: any = await response.json();

	return {
		result: body.sentences.map((n: any) => (n && n.trans) || '').join('') as string,
		sources: body.ld_result.srclangs as string[],
		raw: body,
	};
};
