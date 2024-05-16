import { For, Show, Suspense, createEffect, createMemo, createResource, createSignal } from 'solid-js';

import { withProxy } from '@mary/bluesky-client/xrpc';

import { multiagent } from '~/api/globals/agent';

import { createDerivedSignal, makeAbortable } from '~/utils/hooks';

import { createChatFirehose } from '~/desktop/lib/messages/firehose';

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
		const firehose = createChatFirehose(proxied);

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
			setViews((views) => (views.length > 1 ? views.slice(0, -1) : views));
		},
		replace(next) {
			setViews((views) => (views.length > 1 ? views.with(views.length - 1, next) : views));
		},
		to(next) {
			setViews((views) => views.concat(next));
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

			if (initialState.members) {
				setViews([
					{ kind: ViewKind.CHANNEL_LISTING },
					{ kind: ViewKind.RESOLVE_CHANNEL, members: initialState.members },
				]);
			} else {
				setViews([{ kind: ViewKind.CHANNEL_LISTING }]);
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
								<For each={views()}>
									{(view) => (
										<div class="contents" hidden={current() !== view}>
											<ChatRouterView view={view} />
										</div>
									)}
								</For>
							</ChatPaneContext.Provider>
						);
					}}
				</Show>
			</Suspense>
		</div>
	);
};

export default MessagesPane;
