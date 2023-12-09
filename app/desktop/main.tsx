import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { QueryClientProvider } from '@pkg/solid-query';
import { Router, useRoutes } from '@solidjs/router';

import { useMediaQuery } from '~/utils/media-query.ts';

import { ModalProvider } from '~/com/globals/modals.tsx';

import { SharedPreferences } from '~/com/components/SharedPreferences.tsx';

import ComposerContextProvider from './components/composer/ComposerContextProvider.tsx';

import { createSharedPreferencesObject, preferences } from './globals/settings.ts';
import { queryClient } from './globals/query.ts';

import './styles/tailwind.css';

const App = () => {
	const Routes = useRoutes([
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
		<Router>
			<QueryClientProvider client={queryClient}>
				<SharedPreferences.Provider value={/* @once */ createSharedPreferencesObject()}>
					<ComposerContextProvider>
						<Routes />
						<ModalProvider />
					</ComposerContextProvider>
				</SharedPreferences.Provider>
			</QueryClientProvider>
		</Router>
	);
};

// The scroll restoration that Firefox does makes it broken, there's nothing to
// actually restore scroll position on anyway.
history.scrollRestoration = 'manual';

render(() => <App />, document.body);
