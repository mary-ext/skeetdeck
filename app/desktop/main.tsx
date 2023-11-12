import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, useRoutes } from '@solidjs/router';
import { QueryClientProvider } from '@tanstack/solid-query';

import { ModalProvider } from '~/com/globals/modals.tsx';
import { useMediaQuery } from '~/utils/media-query.ts';

import { preferences } from '~/desktop/globals/settings.ts';
import { queryClient } from '~/desktop/globals/query.ts';

import '~/desktop/styles/tailwind.css';
import { ModerationContext } from '~/com/components/moderation/ModerationContext.tsx';

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
		const theme = preferences.theme;

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
				<ModerationContext.Provider value={/* @once */ preferences.moderation}>
					<Routes />
					<ModalProvider desktop />
				</ModerationContext.Provider>
			</QueryClientProvider>
		</Router>
	);
};

// The scroll restoration that Firefox does makes it broken, there's nothing to
// actually restore scroll position on anyway.
history.scrollRestoration = 'manual';

render(() => <App />, document.body);
