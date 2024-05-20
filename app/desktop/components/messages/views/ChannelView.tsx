import { createResource, Match, onCleanup, Show, Switch, type ResourceOptions } from 'solid-js';

import { getCachedConvo, mergeConvo, SignalizedConvo } from '~/api/stores/convo';

import ChannelHeader from '../components/ChannelHeader';
import ChannelMessages, { type ChannelMessagesRef } from '../components/ChannelMessages';
import Composition from '../components/Composition';
import CompositionBlocked from '../components/CompositionBlocked';
import CompositionDisabled from '../components/CompositionDisabled';
import FirehoseIndicator from '../components/FirehoseStatus';

import { ChannelContext } from '../contexts/channel';
import { useChatPane } from '../contexts/chat';
import type { ViewKind, ViewParams } from '../contexts/router';

const ChannelView = ({ id }: ViewParams<ViewKind.CHANNEL>) => {
	const { did, firehose, channels, rpc, router } = useChatPane();

	const getInitialConvo = (): ResourceOptions<SignalizedConvo> => {
		const convo = getCachedConvo(did, id);
		return convo ? { initialValue: convo } : {};
	};

	const [convo] = createResource(async () => {
		const { data } = await rpc.get('chat.bsky.convo.getConvo', { params: { convoId: id } });
		return mergeConvo(did, data.convo);
	}, getInitialConvo());

	return (
		<Show when={convo.latest} keyed>
			{(convo) => {
				let inputRef: HTMLTextAreaElement | undefined;
				let messagesRef: ChannelMessagesRef | undefined;

				const channel = channels.get(convo.id);
				onCleanup(firehose.requestPollInterval(3_000));

				onCleanup(
					firehose.emitter.on('event', (event) => {
						if (event.$type === 'chat.bsky.convo.defs#logLeaveConvo') {
							if (event.convoId === convo.id) {
								router.back();
							}
						}
					}),
				);

				const isBlocking = () => {
					return convo.recipients.value.every((recipient) => {
						const viewer = recipient.viewer;
						return viewer.blocking.value !== undefined || viewer.blockingByList.value !== undefined;
					});
				};

				const handleKeyDown = (ev: KeyboardEvent) => {
					if (!ev.defaultPrevented) {
						if (ev.key === 'Escape') {
							ev.preventDefault();
							inputRef!.focus();
							messagesRef!.jumpToBottom();
						} else if (ev.key === 'PageUp') {
							ev.preventDefault();
							messagesRef!.scrollUp();
						} else if (ev.key === 'PageDown') {
							ev.preventDefault();
							messagesRef!.scrollDown();
						}
					}
				};

				return (
					<div onKeyDown={handleKeyDown} class="contents">
						<ChannelContext.Provider value={{ convo, channel }}>
							<ChannelHeader />
							<FirehoseIndicator />

							<div class="flex min-h-0 shrink grow flex-col-reverse">
								<Switch fallback={<Composition ref={(ref) => (inputRef = ref)} />}>
									<Match when={convo.disabled.value}>
										<CompositionDisabled />
									</Match>
									<Match when={isBlocking()}>
										<CompositionBlocked />
									</Match>
								</Switch>

								<ChannelMessages ref={(ref) => (messagesRef = ref)} />
							</div>
						</ChannelContext.Provider>
					</div>
				);
			}}
		</Show>
	);
};

export default ChannelView;
