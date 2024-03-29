import { createMemo } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';

import { getInitialPostThread, getPostThread, getPostThreadKey } from '~/api/queries/get-post-thread';

import { PANE_TYPE_THREAD, SpecificPaneSize, type ThreadPaneConfig } from '../../../globals/panes';
import { addPane, preferences } from '../../../globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add';

import { useDeckContext } from '../DeckContext';
import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

import ThreadView from '../partials/ThreadView';

export interface ThreadPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const ThreadPaneDialog = (props: ThreadPaneDialogProps) => {
	const { actor, rkey } = props;

	const { deck } = useDeckContext();
	const { pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const ui = preferences.ui;

	const size = createMemo(() => {
		const $size = pane.size;

		if ($size === SpecificPaneSize.INHERIT) {
			return preferences.ui.defaultPaneSize;
		}

		return $size;
	});

	const thread = createQuery(() => {
		const isLarge = ui.threadedReplies && size() === SpecificPaneSize.LARGE;
		const key = getPostThreadKey(pane.uid, actor, rkey, !isLarge ? 4 : 6, 10);

		return {
			queryKey: key,
			queryFn: getPostThread,
			placeholderData: () => getInitialPostThread(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader title="Thread">
				{(thread.isSuccess || thread.isPlaceholderData) && (
					<button
						title="Add as column"
						onClick={() => {
							addPane<ThreadPaneConfig>(
								deck,
								{
									type: PANE_TYPE_THREAD,
									uid: pane.uid,
									thread: {
										actor: actor,
										rkey: rkey,
									},
								},
								index() + 1,
							);

							modal.close();
						}}
						class={/* @once */ IconButton({ edge: 'right' })}
					>
						<TableColumnRightAddIcon />
					</button>
				)}
			</PaneDialogHeader>

			<div class="min-h-0 grow overflow-y-auto">
				<ThreadView actor={actor} thread={thread} />
			</div>
		</PaneDialog>
	);
};

export default ThreadPaneDialog;
