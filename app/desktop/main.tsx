import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { QueryClientProvider } from '@pkg/solid-query';
import { Router, useRoutes } from '@solidjs/router';

import type { ModerationOpts } from '~/api/moderation/types.ts';

import { ModalProvider } from '~/com/globals/modals.tsx';
import { useMediaQuery } from '~/utils/media-query.ts';

import { preferences } from '~/desktop/globals/settings.ts';
import { queryClient } from '~/desktop/globals/query.ts';

import { ModerationContext } from '~/com/components/moderation/ModerationContext.tsx';

import '~/desktop/styles/tailwind.css';

// `ModerationOpts` contains internal state properties, we don't want it
// reflecting back to persisted storage, spreading it like this is fine and
// shouldn't affect subproxies.
const getModerationOptions = (): ModerationOpts => {
	return { ...preferences.moderation };
};

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
				<ModerationContext.Provider value={/* @once */ getModerationOptions()}>
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
