import { multiagent } from '~/api/globals/agent';

import { createDerivedSignal } from '~/utils/hooks';

import { ChatPaneContext, type ChatPaneState } from './contexts/chat-pane';
import { MultichatRenderer } from './contexts/multichat-renderer';
import { ChatRouter } from './contexts/router-provider';

export interface MessagesPaneProps {
	onClose: () => void;
}

const MessagesPane = (props: MessagesPaneProps) => {
	const [uid, setUid] = createDerivedSignal(() => multiagent.active);

	const context: ChatPaneState = {
		getActive: uid,
		setActive: setUid,
		close: props.onClose,
	};

	return (
		<ChatPaneContext.Provider value={context}>
			<div class="flex w-96 shrink-0 flex-col border-r border-divider">
				<MultichatRenderer did={uid()} accounts={multiagent.accounts.map((x) => x.did)}>
					<ChatRouter />
				</MultichatRenderer>
			</div>
		</ChatPaneContext.Provider>
	);
};

export default MessagesPane;
