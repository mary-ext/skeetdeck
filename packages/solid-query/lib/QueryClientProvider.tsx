import { QueryClient } from '@tanstack/query-core';

import { createContext, onCleanup, useContext, type JSX } from 'solid-js';

export const QueryClientContext = createContext<QueryClient>();

export const useQueryClient = (queryClient?: QueryClient) => {
	if (queryClient) {
		return queryClient;
	}

	const client = useContext(QueryClientContext);

	if (!client) {
		throw new Error('No QueryClient set, use QueryClientProvider to set one');
	}

	return client;
};

export interface QueryClientProviderProps {
	client: QueryClient;
	children?: JSX.Element;
}

export const QueryClientProvider = (props: QueryClientProviderProps): JSX.Element => {
	const client = props.client;

	client.mount();
	onCleanup(() => client.unmount());

	return <QueryClientContext.Provider value={client}>{props.children}</QueryClientContext.Provider>;
};
