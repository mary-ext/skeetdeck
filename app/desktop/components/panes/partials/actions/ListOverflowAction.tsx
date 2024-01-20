import { type JSX, lazy } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedList } from '~/api/stores/lists.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu.ts';

import ReportDialog from '~/com/components/dialogs/ReportDialog.tsx';
import { Flyout } from '~/com/components/Flyout.tsx';

import DeleteIcon from '~/com/icons/baseline-delete.tsx';
import LaunchIcon from '~/com/icons/baseline-launch.tsx';
import ReportIcon from '~/com/icons/baseline-report.tsx';

const PruneListOrphanDialog = lazy(() => import('~/com/components/dialogs/lists/PruneListOrphanDialog.tsx'));

export interface FeedOverflowActionProps {
	list: SignalizedList;
	children: JSX.Element;
}

const ListOverflowAction = (props: FeedOverflowActionProps) => {
	return (() => {
		const list = props.list;
		const creator = list.creator;

		const isOwner = list.uid === creator.did;

		return (
			<Flyout button={props.children} placement="bottom-end">
				{({ close, menuProps }) => (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<a
							href={`https://bsky.app/profile/${creator.did}/lists/${getRecordId(list.uri)}`}
							target="_blank"
							onClick={close}
							class={/* @once */ MenuItem()}
						>
							<LaunchIcon class={/* @once */ MenuItemIcon()} />
							<span>Open in Bluesky app</span>
						</a>

						{isOwner && (
							<button
								onClick={() => {
									close();
									openModal(() => <PruneListOrphanDialog list={list} />);
								}}
								class={/* @once */ MenuItem()}
							>
								<DeleteIcon class={/* @once */ MenuItemIcon()} />
								<span>Prune orphan members</span>
							</button>
						)}

						<button
							onClick={() => {
								close();

								openModal(() => (
									<ReportDialog
										uid={/* @once */ list.uid}
										report={/* @once */ { type: 'list', uri: list.uri, cid: list.cid.value }}
									/>
								));
							}}
							class={/* @once */ MenuItem()}
						>
							<ReportIcon class={/* @once */ MenuItemIcon()} />
							<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report list</span>
						</button>
					</div>
				)}
			</Flyout>
		);
	}) as unknown as JSX.Element;
};

export default ListOverflowAction;
