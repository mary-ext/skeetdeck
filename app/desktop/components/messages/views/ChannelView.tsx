import { createResource, Show, type ResourceOptions } from 'solid-js';

import { getCachedConvo, mergeConvo, SignalizedConvo } from '~/api/stores/convo';

import ChannelHeader from '../components/ChannelHeader';
import ChannelMessages from '../components/ChannelMessages';
import Composition from '../components/Composition';

import { useChatPane } from '../contexts/chat';
import type { ViewKind, ViewParams } from '../contexts/router';

const ChannelView = ({ id }: ViewParams<ViewKind.CHANNEL>) => {
	const { did, rpc } = useChatPane();

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
			{(convo) => (
				<>
					<ChannelHeader convo={convo} />
					<ChannelMessages convo={convo} fetchLimit={50} />
					<Composition convo={convo} />
				</>
			)}
		</Show>
	);
};

export default ChannelView;
