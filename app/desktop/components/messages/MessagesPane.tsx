import { makeEventListener } from '@solid-primitives/event-listener';
import {
	ErrorBoundary,
	For,
	Show,
	createEffect,
	createMemo,
	createRenderEffect,
	createResource,
	createSignal,
	onCleanup,
	untrack,
} from 'solid-js';

import { withProxy } from '@mary/bluesky-client/xrpc';

import { getPrivilegedAccounts, multiagent } from '~/api/globals/agent';

import type { At } from '~/api/atp-schema';
import { makeAbortable } from '~/utils/hooks';

import { createChannel, type Channel } from '~/desktop/lib/messages/channel';
import { createChatFirehose } from '~/desktop/lib/messages/firehose';
import { createLRU } from '~/desktop/lib/messages/lru';

import { NoopLinkingProvider } from './components/NoopLinkingProvider';
import { ChatPaneContext, type ChatPaneState, type ChatRouterState } from './contexts/chat';
import { ViewKind, type View } from './contexts/router';
import { ChatRouterView } from './contexts/router-view';

import { useMessages, type MessagesInitialState } from './MessagesContext';
import { DM_SERVICE_PROXY } from './const';

export interface MessagesPaneProps {
	isOpen: () => boolean;
	onClose: () => void;
}

const MessagesPane = (props: MessagesPaneProps) => {
	const context = useMessages();

	const [uid, setUid] = createSignal<At.DID>();
	const [views, setViews] = createSignal<View[]>([{ kind: ViewKind.CHANNEL_LISTING }]);

	const current = createMemo(() => views().at(-1)!);

	const [abortable] = makeAbortable();
	const [partial] = createResource(uid, async (did) => {
		const signal = abortable();
		const { rpc } = await multiagent.connect(did);

		const proxied = withProxy(rpc, DM_SERVICE_PROXY);

		const firehose = createChatFirehose(proxied);
		const channels = createLRU<string, Channel>({
			maxSize: 3,
			create(id) {
				return createChannel({
					channelId: id,
					did: did,
					firehose,
					rpc: proxied,
				});
			},
			destroy(channel) {
				return channel.destroy();
			},
		});

		if (!signal.aborted) {
			firehose.init();
		}

		return { did: did, rpc: proxied, firehose, channels };
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

	createRenderEffect(() => {
		const accounts = getPrivilegedAccounts().map((acc) => acc.did);
		const current = untrack(uid);

		if (current === undefined || !accounts.includes(current)) {
			setUid(accounts.length > 0 ? accounts[0] : undefined);
		}
	});

	return (
		<div class="flex w-96 shrink-0 flex-col border-r border-divider">
			<Show when={partial()} keyed>
				{(partialState) => {
					const ctx: ChatPaneState = {
						...partialState,
						router: router,
						isOpen: props.isOpen,
						close: props.onClose,
						changeAccount: setUid,
					};

					makeEventListener(document, 'focus', ctx.firehose.resume);
					makeEventListener(document, 'blur', ctx.firehose.background);

					onCleanup(() => {
						ctx.firehose.destroy();
						ctx.channels.clear();

						context.setUnreadCount(0);
					});

					return (
						<NoopLinkingProvider>
							<ChatPaneContext.Provider value={ctx}>
								<For each={views()}>
									{(view) => (
										<div class="contents" hidden={current() !== view}>
											<ChatRouterView view={view} />
										</div>
									)}
								</For>
							</ChatPaneContext.Provider>
						</NoopLinkingProvider>
					);
				}}
			</Show>
		</div>
	);
};

export default MessagesPane;
