import { type JSX, lazy } from 'solid-js';

import type { SignalizedList } from '~/api/stores/lists';
import { getRecordId } from '~/api/utils/misc';

import { openModal } from '~/com/globals/modals';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { Flyout } from '~/com/components/Flyout';

import CopyAllIcon from '~/com/icons/baseline-copy-all';
import LaunchIcon from '~/com/icons/baseline-launch';
import CleaningServicesOutlinedIcon from '~/com/icons/outline-cleaning-services';
import ReportProblemOutlinedIcon from '~/com/icons/outline-report-problem';

const CloneListMembersDialog = lazy(() => import('~/com/components/dialogs/lists/CloneListMembersDialog'));
const PruneListOrphanDialog = lazy(() => import('~/com/components/dialogs/lists/PruneListOrphanDialog'));
const ReportDialog = lazy(() => import('~/com/components/dialogs/ReportDialog'));

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

						<button
							onClick={() => {
								close();
								openModal(() => <CloneListMembersDialog list={list} />);
							}}
							class={/* @once */ MenuItem()}
						>
							<CopyAllIcon class={/* @once */ MenuItemIcon()} />
							<span>Copy list members</span>
						</button>

						{isOwner ? (
							<button
								onClick={() => {
									close();
									openModal(() => <PruneListOrphanDialog list={list} />);
								}}
								class={/* @once */ MenuItem()}
							>
								<CleaningServicesOutlinedIcon class={/* @once */ MenuItemIcon()} />
								<span>Prune orphan members</span>
							</button>
						) : (
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
								<ReportProblemOutlinedIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report list</span>
							</button>
						)}
					</div>
				)}
			</Flyout>
		);
	}) as unknown as JSX.Element;
};

export default ListOverflowAction;
