import { createMemo } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info.ts';

import { type CustomFeedPaneConfig, PANE_TYPE_FEED } from '../../../globals/panes.ts';
import { addPane } from '../../../globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add.tsx';

import { usePaneContext, usePaneModalState } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

import FeedHeader from '../partials/FeedHeader.tsx';

export interface FeedPaneDialogProps {
	/** Expected to be static */
	actor: DID;
	/** Expected to be static */
	rkey: string;
}

const FeedPaneDialog = (props: FeedPaneDialogProps) => {
	const { actor, rkey } = props;

	const { deck, pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const uri = `at://${actor}/app.bsky.feed.generator/${rkey}`;

	const feed = createQuery((client) => {
		const key = getFeedInfoKey(pane.uid, uri);

		return {
			queryKey: key,
			queryFn: getFeedInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialFeedInfo(client, key),
		};
	});

	const hasFeed = createMemo(() => feed.data !== undefined);

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $feed = feed.data;

					if ($feed) {
						return $feed.displayName;
					}

					return `Feed`;
				})()}
			>
				{(() => {
					if (hasFeed()) {
						return (
							<button
								title="Add as column"
								onClick={() => {
									const $feed = feed.data!;

									addPane<CustomFeedPaneConfig>(
										deck,
										{
											type: PANE_TYPE_FEED,
											uid: pane.uid,
											feed: {
												name: $feed.displayName,
												uri: $feed.uri,
											},
											infoVisible: true,
										},
										index() + 1,
									);

									modal.close();
								}}
								class={/* @once */ IconButton({ edge: 'right' })}
							>
								<TableColumnRightAddIcon />
							</button>
						);
					}
				})()}
			</PaneDialogHeader>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<FeedHeader uid={pane.uid} feed={feed.data} />

				<hr class="border-divider" />

				<TimelineList uid={pane.uid} params={{ type: 'feed', uri: uri }} />
			</div>
		</PaneDialog>
	);
};

export default FeedPaneDialog;
