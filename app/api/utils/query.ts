import {
	type InfiniteData,
	type QueryClient,
	type QueryFunctionContext,
	type QueryKey,
} from '@pkg/solid-query';

export const resetInfiniteData = (client: QueryClient, key: QueryKey) => {
	client.setQueryData<InfiniteData<unknown>>(key, (data) => {
		if (data && data.pages.length > 1) {
			return {
				pages: data.pages.slice(0, 1),
				pageParams: data.pageParams.slice(0, 1),
			};
		}

		return data;
	});
};

const errorMap = new WeakMap<WeakKey, { pageParam: any; direction: 'forward' | 'backward' }>();

export const wrapInfiniteQuery = <C extends QueryFunctionContext<any, any>, R>(
	fn: (ctx: C) => Promise<R>,
) => {
	return async (ctx: C): Promise<R> => {
		try {
			return await fn(ctx);
		} catch (err) {
			errorMap.set(err as any, { pageParam: ctx.pageParam, direction: ctx.direction });
			throw err;
		}
	};
};

export const getQueryErrorInfo = (err: unknown) => {
	const info = errorMap.get(err as any);
	return info;
};
