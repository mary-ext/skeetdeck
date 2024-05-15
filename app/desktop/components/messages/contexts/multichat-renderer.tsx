import { Show, Suspense, createResource, type JSX } from 'solid-js';

import { withProxy } from '@mary/bluesky-client/xrpc';
import { KeepAlive } from '@mary/solid-freeze';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { ChatFirehose } from '~/desktop/lib/messages/firehose';

import CircularProgress from '~/com/components/CircularProgress';

import { DM_SERVICE_PROXY } from '../const';
import { MultichatContext } from './multichat';

export interface MultichatRendererProps {
	did: At.DID | undefined;
	accounts: At.DID[];
	children: JSX.Element;
}

export const MultichatRenderer = (props: MultichatRendererProps) => {
	return (
		<KeepAlive value={props.did} include={props.accounts}>
			{(did) => {
				let destroyed = false;

				const [state] = createResource(async () => {
					const { rpc } = await multiagent.connect(did);

					const proxied = withProxy(rpc, DM_SERVICE_PROXY);
					const firehose = new ChatFirehose(proxied);

					if (!destroyed) {
						firehose.init();
					}

					return { did: did, rpc: proxied, firehose };
				});

				return (
					<Suspense
						fallback={
							<div class="grid grow place-items-center">
								<CircularProgress />
							</div>
						}
					>
						<Show when={state()} keyed>
							{($state) => {
								return <MultichatContext.Provider value={$state}>{props.children}</MultichatContext.Provider>;
							}}
						</Show>
					</Suspense>
				);
			}}
		</KeepAlive>
	);
};
