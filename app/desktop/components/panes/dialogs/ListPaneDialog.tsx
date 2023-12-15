import { createMemo } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info.ts';

import { type CustomListPaneConfig, PANE_TYPE_LIST } from '../../../globals/panes.ts';
import { addPane } from '../../../globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import ListMembersList from '~/com/components/lists/ListMembersList.tsx';
import GenericErrorView from '~/com/components/views/GenericErrorView.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';
import { LINK_PROFILE, useLinking } from '~/com/components/Link.tsx';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add.tsx';

import { usePaneContext, usePaneModalState } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

import ListHeader from '../partials/ListHeader.tsx';

export interface ListPaneDialogProps {
	/** Expected to be static */
	actor: DID;
	/** Expected to be static */
	rkey: string;
}

const ListPaneDialog = (props: ListPaneDialogProps) => {
	const { actor, rkey } = props;

	const linking = useLinking();

	const { deck, pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const uri = `at://${actor}/app.bsky.graph.list/${rkey}`;

	const list = createQuery((client) => {
		const key = getListInfoKey(pane.uid, uri);

		return {
			queryKey: key,
			queryFn: getListInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialListInfo(client, key),
		};
	});

	const hasList = createMemo(() => list.data !== undefined);

	const isCurationList = createMemo(() => {
		const $list = list.data;
		return $list ? $list.purpose === 'app.bsky.graph.defs#curatelist' : false;
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $list = list.data;

					if ($list) {
						return $list.name;
					}

					return `List`;
				})()}
			>
				{(() => {
					if (isCurationList()) {
						return (
							<button
								title="Add as column"
								onClick={() => {
									const $list = list.data!;

									addPane<CustomListPaneConfig>(
										deck,
										{
											type: PANE_TYPE_LIST,
											uid: pane.uid,
											list: {
												name: $list.name,
												uri: $list.uri,
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
				{(() => {
					if (list.isError) {
						return <GenericErrorView error={list.error} onRetry={() => list.refetch()} />;
					}

					return [<ListHeader uid={pane.uid} list={list.data} />, <hr class="border-divider" />];
				})()}

				{(() => {
					if (list.isLoading && !list.data) {
						return (
							<div class="grid h-13 place-items-center">
								<CircularProgress />
							</div>
						);
					}
				})()}

				{(() => {
					if (!hasList()) {
						return;
					}

					if (isCurationList()) {
						return <TimelineList uid={pane.uid} params={{ type: 'list', uri: list.data!.uri }} />;
					}

					return (
						<ListMembersList
							uid={pane.uid}
							uri={list.data!.uri}
							onClick={(profile) => {
								linking.navigate({ type: LINK_PROFILE, actor: profile.did });
							}}
						/>
					);
				})()}
			</div>
		</PaneDialog>
	);
};

export default ListPaneDialog;
