import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, configureRouter } from '@pkg/solid-page-router';
import { QueryClientProvider } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent';

import { useMediaQuery } from '~/utils/media-query';

import { ModalProvider } from '~/com/globals/modals';
import { MetaProvider } from '~/com/lib/meta';

import { SharedPreferences } from '~/com/components/SharedPreferences';

import ComposerContextProvider from './components/composer/ComposerContextProvider';

import { createSharedPreferencesObject, preferences } from './globals/settings';
import { queryClient } from './globals/query';

import './styles/tailwind.css';

import('./lib/moderation/update');

configureRouter([
	{
		path: '/',
		component: lazy(() => import('./views/Layout')),
		children: [
			{
				path: '/',
				component: lazy(() => import('./views/EmptyView')),
			},
			{
				path: '/decks/:deck',
				component: lazy(() => import('./views/DecksView')),
			},
		],
	},
]);

const App = () => {
	createRenderEffect(() => {
		multiagent.services.value = preferences.moderation.services.map((service) => ({
			did: service.did,
			redact: service.redact,
		}));
	});

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
