import { Router, configureRouter } from '@pkg/solid-page-router';
import { createEffect, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { QueryClientProvider } from '@mary/solid-query';

import { multiagent } from '~/api/globals/agent';
import type { ModerationOptions } from '~/api/moderation';

import { ModalProvider } from '~/com/globals/modals';
import * as shared from '~/com/globals/shared';

import { useMediaQuery } from '~/utils/media-query';

import { MetaProvider } from '~/com/lib/meta';

import ComposerContextProvider from './components/composer/ComposerContextProvider';
import MessagesContextProvider from './components/messages/MessagesContextProvider';
import { queryClient } from './globals/query';
import { preferences } from './globals/settings';

import './styles/tailwind.css';

import('./lib/scheduled');

const App = () => {
	createEffect(() => {
		// Sets up the multiagent labeler header
		multiagent.services.value = preferences.moderation.services.map((service) => ({
			did: service.did,
			redact: service.redact,
		}));
	});

	createEffect(() => {
		const theme = preferences.ui.theme;

		const cl = document.documentElement.classList;

		if (theme === 'auto') {
			const isDark = useMediaQuery('(prefers-color-scheme: dark)');

			createEffect(() => {
				cl.toggle('is-dark', isDark());
			});
		} else {
			cl.toggle('is-dark', theme === 'dark');
		}
	});

	return (
		<QueryClientProvider client={queryClient}>
			<MetaProvider>
				<ComposerContextProvider>
					<MessagesContextProvider>
						<Router />
						<ModalProvider />
					</MessagesContextProvider>
				</ComposerContextProvider>
			</MetaProvider>
		</QueryClientProvider>
	);
};

// Add polyfill for Promise.withResolvers, remove this later.
{
	Promise.withResolvers ??= function <T>(): PromiseWithResolvers<T> {
		let resolve!: (value: T | PromiseLike<T>) => void;
		let reject!: (reason?: any) => void;

		const promise = new this<T>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		return { promise, resolve, reject };
	};
}

// Set up the router
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

// Set up common preferences
{
	const moderation = preferences.moderation;
	const createModerationOptions = (): ModerationOptions => {
		return {
			labels: moderation.labels,
			services: moderation.services,
			keywords: moderation.keywords,
			hideReposts: moderation.hideReposts,
			tempMutes: moderation.tempMutes,
		};
	};

	shared.setLanguagePreferences(preferences.language);
	shared.setModerationOptions(createModerationOptions());
	shared.setTranslationPreferences(preferences.translation);

	shared.setBustModerationListener(() => {
		shared.setModerationOptions({ ...shared.getModerationOptions(), ...createModerationOptions() });
	});
}

// The scroll restoration that Firefox does makes it broken, there's nothing to
// actually restore scroll position on anyway.
history.scrollRestoration = 'manual';

render(() => <App />, document.body);
