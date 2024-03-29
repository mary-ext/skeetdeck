import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';

import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info';

import { type CustomFeedPaneConfig, PANE_TYPE_FEED } from '../../../globals/panes';
import { addPane } from '../../../globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add';

import { useDeckContext } from '../DeckContext';
import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

import FeedHeader from '../partials/FeedHeader';

export interface FeedPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const FeedPaneDialog = (props: FeedPaneDialogProps) => {
	const { actor, rkey } = props;

	const { deck } = useDeckContext();
	const { pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const uri = `at://${actor}/app.bsky.feed.generator/${rkey}`;

	const feed = createQuery(() => {
		const key = getFeedInfoKey(pane.uid, uri);

		return {
			queryKey: key,
			queryFn: getFeedInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialFeedInfo(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $feed = feed.data;

					if ($feed) {
						return $feed.name.value;
					}

					return `Feed`;
				})()}
			>
				{(() => {
					const $feed = feed.data;

					if ($feed) {
						return (
							<button
								title="Add as column"
								onClick={() => {
									addPane<CustomFeedPaneConfig>(
										deck,
										{
											type: PANE_TYPE_FEED,
											uid: pane.uid,
											feed: {
												name: $feed.name.value,
												uri: $feed.uri,
											},
											showReplies: true,
											showReposts: true,
											showQuotes: true,
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
				<FeedHeader feed={feed.data} />

				<hr class="border-divider" />

				<TimelineList
					uid={pane.uid}
					params={{
						type: 'feed',
						uri: uri,
						showReplies: true,
						showReposts: true,
						showQuotes: true,
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default FeedPaneDialog;
