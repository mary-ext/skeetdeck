import { type InfiniteData, type QueryClient, type QueryKey } from '@pkg/solid-query';

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
