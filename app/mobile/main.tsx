import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { RouterView } from '@pkg/solid-navigation';
import { QueryClientProvider } from '@pkg/solid-query';

import { MetaProvider } from '~/com/lib/meta';
import { ModalProvider } from '~/com/globals/modals';

import { useMediaQuery } from '~/utils/media-query';

import { preferences } from './globals/settings';
import { queryClient } from './globals/query';

import './globals/router';

import CircularProgress from '~/com/components/CircularProgress';

import './styles/tailwind.css';

const Root = lazy(() => import('./views/_root'));

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
				<Root>
					<RouterView
						fallback={
							<div class="grid grow place-items-center">
								<CircularProgress />
							</div>
						}
					/>
				</Root>

				<ModalProvider />
			</MetaProvider>
		</QueryClientProvider>
	);
};

render(() => <App />, document.body);
