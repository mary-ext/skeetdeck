import { For, Suspense, createMemo, createSignal } from 'solid-js';

import CircularProgress from '~/com/components/CircularProgress';

import { ChatRouterContext, ViewKind, type ChatRouterState, type View } from './router';
import { ChatRouterView } from './router-view';

export const ChatRouter = () => {
	const [views, setViews] = createSignal<View[]>([{ kind: ViewKind.CHANNEL_LISTING }]);
	const current = createMemo(() => views().at(-1)!);

	const router: ChatRouterState = {
		get current() {
			return current();
		},
		get canGoBack() {
			return views().length > 1;
		},
		back() {
			const $views = views();

			if ($views.length > 1) {
				setViews($views.slice(0, -1));
			}
		},
		to(next) {
			setViews(views().concat(next));
		},
	};

	return (
		<ChatRouterContext.Provider value={router}>
			<For each={views()}>{(view) => <ChatRouterView view={view} />}</For>
		</ChatRouterContext.Provider>
	);
};
