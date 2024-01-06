import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, configureRouter } from '@pkg/solid-page-router';
import { QueryClientProvider } from '@pkg/solid-query';

import { useMediaQuery } from '~/utils/media-query.ts';

import { ModalProvider } from '~/com/globals/modals.tsx';
import { MetaProvider } from '~/com/lib/meta.tsx';

import { SharedPreferences } from '~/com/components/SharedPreferences.tsx';

import ComposerContextProvider from './components/composer/ComposerContextProvider.tsx';

import { createSharedPreferencesObject, preferences } from './globals/settings.ts';
import { queryClient } from './globals/query.ts';

import './styles/tailwind.css';

configureRouter([
	{
		path: '/',
		component: lazy(() => import('./views/Layout.tsx')),
		children: [
			{
				path: '/',
				component: lazy(() => import('./views/EmptyView.tsx')),
			},
			{
				path: '/decks/:deck',
				component: lazy(() => import('./views/DecksView.tsx')),
			},
		],
	},
]);

const App = () => {
	createRenderEffect(() => {
		const theme = preferences.ui.theme;

		const cl = document.documentElement.classList;

		if (theme === 'auto') {
			const isDark = useMediaQuery('(prefers-color-scheme: dark)');

			createRenderEffect(() => {
				cl.toggle('is-dark', isDark());
			});
		} else {
			cl.toggle('is-dark', theme === 'dark');
		}
	});

	return (
		<QueryClientProvider client={queryClient}>
			<MetaProvider>
				<SharedPreferences.Provider value={/* @once */ createSharedPreferencesObject()}>
					<ComposerContextProvider>
						<Router />
						<ModalProvider />
					</ComposerContextProvider>
				</SharedPreferences.Provider>
			</MetaProvider>
		</QueryClientProvider>
	);
};

// The scroll restoration that Firefox does makes it broken, there's nothing to
// actually restore scroll position on anyway.
history.scrollRestoration = 'manual';

render(() => <App />, document.body);
