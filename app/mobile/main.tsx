import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { QueryClientProvider } from '@pkg/solid-query';

import { MetaProvider } from '~/com/lib/meta';
import { ModalProvider } from '~/com/globals/modals';

import { useMediaQuery } from '~/utils/media-query';

import { createSharedPreferencesObject, preferences } from './globals/settings';
import { queryClient } from './globals/query';
import { RouterView } from './globals/router';

import { SharedPreferences } from '~/com/components/SharedPreferences';

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
