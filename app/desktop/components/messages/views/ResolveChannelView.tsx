import { Show, createResource } from 'solid-js';

import { mergeConvo } from '~/api/stores/convo';

import { useChatPane } from '../contexts/chat';
import { ViewKind, type ViewParams } from '../contexts/router';

const ResolveChannelView = ({ members }: ViewParams<ViewKind.RESOLVE_CHANNEL>) => {
	const { did, rpc, router } = useChatPane();

	const [resolution] = createResource(async () => {
		const { data } = await rpc.get('chat.bsky.convo.getConvoForMembers', {
			params: { members },
		});

		return mergeConvo(did, data.convo);
	});

	return (
		<Show when={resolution()} keyed>
			{(res) => {
				router.replace({ kind: ViewKind.CHANNEL, id: res.id });
				return null;
			}}
		</Show>
	);
};

export default ResolveChannelView;
