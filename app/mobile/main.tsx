import { createRenderEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { RouterView, configureRouter } from '@pkg/solid-navigation';
import { QueryClientProvider } from '@pkg/solid-query';

import { MetaProvider } from '~/com/lib/meta';
import { ModalProvider } from '~/com/globals/modals';

import { useMediaQuery } from '~/utils/media-query';

import { preferences } from './globals/settings';
import { queryClient } from './globals/query';

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

// Set up router
{
	const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._\-]+$/;
	// const HANDLE_RE = /^@([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]{2,}))$/;

	const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

	const isValidDid = (did: string) => {
		return DID_RE.test(did);
	};
	// const isValidHandle = (handleOrDid: string) => {
	// 	return HANDLE_RE.test(handleOrDid);
	// };
	const isValidTid = (tid: string) => {
		return tid.length === 13 && TID_RE.test(tid);
	};

	configureRouter({
		routes: [
			{
				path: '/',
				component: lazy(() => import('./views/LoggedOut')),
				meta: {
					public: true,
				},
			},
			{
				path: '/sign_in',
				component: lazy(() => import('./views/SignIn')),
				meta: {
					public: true,
				},
			},

			{
				path: '/home',
				component: lazy(() => import('./views/Home')),
				single: true,
				meta: {
					name: 'Home',
					main: true,
				},
			},
			{
				path: '/explore',
				component: lazy(() => import('./views/Explore')),
				single: true,
				meta: {
					name: 'Explore',
					main: true,
				},
			},
			{
				path: '/notifications',
				component: lazy(() => import('./views/Notifications')),
				single: true,
				meta: {
					name: 'Notifications',
					main: true,
				},
			},

			{
				path: '/:actor',
				component: lazy(() => import('./views/Profile')),
				validate: (params) => {
					return isValidDid(params.actor);
				},
			},
			{
				path: '/:actor/:post',
				component: lazy(() => import('./views/Thread')),
				validate: (params) => {
					return isValidDid(params.actor) && isValidTid(params.post);
				},
			},
			{
				path: '*',
				component: lazy(() => import('./views/NotFound')),
				meta: {
					name: 'NotFound',
					public: true,
				},
			},
		],
	});
}

render(() => <App />, document.body);
