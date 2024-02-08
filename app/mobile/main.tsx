import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { QueryClientProvider } from '@pkg/solid-query';

import { MetaProvider } from '~/com/lib/meta.tsx';
import { ModalProvider } from '~/com/globals/modals.tsx';

import { useMediaQuery } from '~/utils/media-query.ts';

import { createSharedPreferencesObject, preferences } from './globals/settings.ts';
import { queryClient } from './globals/query.ts';
import { RouterView } from './globals/router.ts';

import { SharedPreferences } from '~/com/components/SharedPreferences.tsx';

import './styles/tailwind.css';

const Root = lazy(() => import('./views/_root.tsx'));

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
				<SharedPreferences.Provider value={createSharedPreferencesObject()}>
					<Root>
						<RouterView />
					</Root>

					<ModalProvider />
				</SharedPreferences.Provider>
			</MetaProvider>
		</QueryClientProvider>
	);
};

render(() => <App />, document.body);
