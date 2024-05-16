import {
	For,
	Show,
	Suspense,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	onCleanup,
} from 'solid-js';

import { withProxy } from '@mary/bluesky-client/xrpc';

import { multiagent } from '~/api/globals/agent';

import { createDerivedSignal } from '~/utils/hooks';

import { ChatFirehose } from '~/desktop/lib/messages/firehose';

import CircularProgress from '~/com/components/CircularProgress';

import { ChatPaneContext, type ChatPaneState, type ChatRouterState } from './contexts/chat';
import { ViewKind, type View } from './contexts/router';
import { ChatRouterView } from './contexts/router-view';

import { useMessages, type MessagesInitialState } from './MessagesContext';
import { DM_SERVICE_PROXY } from './const';

export interface MessagesPaneProps {
	onClose: () => void;
}

const MessagesPane = (props: MessagesPaneProps) => {
	const context = useMessages();

	const [uid, setUid] = createDerivedSignal(() => multiagent.active);
	const [views, setViews] = createSignal<View[]>([{ kind: ViewKind.CHANNEL_LISTING }]);

	const current = createMemo(() => views().at(-1)!);

	const abortable = makeAbortable();
	const [partial] = createResource(uid, async (did) => {
		const signal = abortable();
		const { rpc } = await multiagent.connect(did);

		const proxied = withProxy(rpc, DM_SERVICE_PROXY);
		const firehose = new ChatFirehose(proxied);

		if (!signal.aborted) {
			firehose.init();
		}

		return { did: did, rpc: proxied, firehose };
	});

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

	createEffect(() => {
		const did = uid();
		const accounts = multiagent.accounts;

		if (!did || accounts.length === 0 || !accounts.some((x) => x.did === did)) {
			setUid(multiagent.active);
		}
	});

	createEffect((prev: MessagesInitialState | null) => {
		const initialState = context.getInitialState();

		if (initialState) {
			setUid(initialState.uid);

			if (initialState.actor) {
				// @todo: redirect to a page that resolves the convo
			}
		} else if (prev) {
			setViews([{ kind: ViewKind.CHANNEL_LISTING }]);
		}

		return initialState;
	}, null);

	return (
		<div class="flex w-96 shrink-0 flex-col border-r border-divider">
			<Suspense
				fallback={
					<div class="grid grow place-items-center">
						<CircularProgress />
					</div>
				}
			>
				<Show when={partial()} keyed>
					{(partialState) => {
						const context: ChatPaneState = {
							...partialState,
							router: router,
							close: props.onClose,
							changeAccount: setUid,
						};

						return (
							<ChatPaneContext.Provider value={context}>
								<For each={views()}>{(view) => <ChatRouterView view={view} />}</For>
							</ChatPaneContext.Provider>
						);
					}}
				</Show>
			</Suspense>
		</div>
	);
};

export default MessagesPane;

const makeAbortable = (): (() => AbortSignal) => {
	let controller: AbortController | undefined;
	onCleanup(() => controller?.abort());

	return () => {
		controller?.abort();
		controller = new AbortController();

		return controller.signal;
	};
};
