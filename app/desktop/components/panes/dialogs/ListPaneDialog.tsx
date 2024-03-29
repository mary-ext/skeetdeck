import type { JSX } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';

import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info';

import { type CustomListPaneConfig, PANE_TYPE_LIST } from '../../../globals/panes';
import { addPane } from '../../../globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';
import ListMembersList from '~/com/components/lists/ListMembersList';
import GenericErrorView from '~/com/components/views/GenericErrorView';
import CircularProgress from '~/com/components/CircularProgress';
import { LINK_PROFILE, useLinking } from '~/com/components/Link';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add';

import { useDeckContext } from '../DeckContext';
import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

import ListHeader from '../partials/ListHeader';

export interface ListPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const ListPaneDialog = (props: ListPaneDialogProps) => {
	const { actor, rkey } = props;

	const linking = useLinking();

	const { deck } = useDeckContext();
	const { pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const uri = `at://${actor}/app.bsky.graph.list/${rkey}`;

	const list = createQuery(() => {
		const key = getListInfoKey(pane.uid, uri);

		return {
			queryKey: key,
			queryFn: getListInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialListInfo(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $list = list.data;

					if ($list) {
						return $list.name.value;
					}

					return `List`;
				})()}
			>
				{(() => {
					const $list = list.data;

					if ($list && $list.purpose.value === 'app.bsky.graph.defs#curatelist') {
						return (
							<button
								title="Add as column"
								onClick={() => {
									addPane<CustomListPaneConfig>(
										deck,
										{
											type: PANE_TYPE_LIST,
											uid: pane.uid,
											list: {
												name: $list.name.value,
												uri: $list.uri,
											},
											showReplies: true,
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
				{(() => {
					const $list = list.data;

					if ($list) {
						return [
							<ListHeader list={$list} />,
							<hr class="border-divider" />,

							() => {
								if ($list.purpose.value === 'app.bsky.graph.defs#curatelist') {
									return (
										<TimelineList
											uid={$list.uid}
											params={{
												type: 'list',
												uri: $list.uri,
												showReplies: true,
												showQuotes: true,
											}}
										/>
									);
								}

								return (
									<ListMembersList
										list={$list}
										onClick={(profile) => {
											linking.navigate({ type: LINK_PROFILE, actor: profile.did });
										}}
									/>
								);
							},
						] as unknown as JSX.Element;
					}

					if (list.isError) {
						return <GenericErrorView error={list.error} onRetry={() => list.refetch()} />;
					}

					return (
						<div class="grid h-13 place-items-center">
							<CircularProgress />
						</div>
					);
				})()}
			</div>
		</PaneDialog>
	);
};

export default ListPaneDialog;
