import { type JSX, lazy } from 'solid-js';

import type { SignalizedList } from '~/api/stores/lists.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';

import { LINK_PROFILE, Link } from '~/com/components/Link.tsx';
import RichTextRenderer from '~/com/components/RichTextRenderer.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import DefaultListAvatar from '~/com/assets/default-list-avatar.svg?url';
import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { usePaneContext } from '../PaneContext.tsx';

import EditIcon from '~/com/icons/baseline-edit.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import ListOverflowAction from './actions/ListOverflowAction.tsx';

const ImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog.tsx'));
const SubscribeListDialog = lazy(() => import('~/com/components/dialogs/SubscribeListDialog.tsx'));

const ListMembersPaneDialog = lazy(() => import('../dialogs/ListMembersPaneDialog.tsx'));
const ListSettingsPaneDialog = lazy(() => import('../dialogs/ListSettingsPaneDialog.tsx'));

export interface ListHeaderProps {
	list?: SignalizedList;
}

const ListHeader = (props: ListHeaderProps) => {
	const { openModal: openPaneModal } = usePaneContext();

	return (() => {
		const list = props.list;

		if (!list) {
			return (
				<div class="p-4" style="height:172px">
					<div class="h-13 w-13 shrink-0 rounded-md bg-secondary/20"></div>
				</div>
			);
		}

		const creator = list.creator;

		const isModList = () => list.purpose.value === 'app.bsky.graph.defs#modlist';

		return (
			<VirtualContainer class="shrink-0">
				<div class="flex flex-col gap-4 p-4">
					<div class="flex gap-4">
						{(() => {
							const avatar = list.avatar.value;

							if (avatar) {
								return (
									<button
										onClick={() => {
											openModal(() => <ImageViewerDialog images={[{ fullsize: avatar }]} />);
										}}
										class="group h-13 w-13 shrink-0 overflow-hidden rounded-md bg-background"
									>
										<img src={avatar} class="h-full w-full object-cover group-hover:opacity-75" />
									</button>
								);
							}

							return <img src={DefaultListAvatar} class="h-13 w-13 shrink-0 rounded-md" />;
						})()}

						<div class="flex min-w-0 grow flex-col">
							<p class="overflow-hidden text-ellipsis break-words text-lg font-bold">{list.name.value}</p>

							<Link
								to={/* @once */ { type: LINK_PROFILE, actor: creator.did }}
								class="group mt-1 flex items-center text-left"
							>
								<img src={creator.avatar.value || DefaultUserAvatar} class="mr-2 h-5 w-5 rounded-full" />
								<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
									{creator.displayName.value}
								</span>
								<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
									@{creator.handle.value}
								</span>
							</Link>
						</div>
					</div>

					<p class="whitespace-pre-wrap break-words text-sm empty:hidden">
						<RichTextRenderer
							item={list}
							get={(item) => {
								return { t: item.description.value || '', f: item.descriptionFacets.value };
							}}
						/>
					</p>

					<div class="flex gap-2 empty:hidden">
						{(() => {
							if (isModList()) {
								const viewer = list.viewer;
								const isSubscribed = () => !!viewer.blocked.value || viewer.muted.value;

								return (
									<button
										onClick={() => {
											openModal(() => <SubscribeListDialog list={list} />);
										}}
										class={Button({ variant: !isSubscribed() ? 'primary' : 'outline' })}
									>
										{!isSubscribed() ? `Subscribe list` : `Unsubscribe list`}
									</button>
								);
							}

							if (list.uid === list.creator.did) {
								return (
									<button
										onClick={() => {
											openPaneModal(() => <ListSettingsPaneDialog list={list} />);
										}}
										class={/* @once */ Button({ variant: 'outline' })}
									>
										Edit list
									</button>
								);
							}

							return (
								<button
									onClick={() => {
										openPaneModal(() => <ListMembersPaneDialog list={list} />);
									}}
									class={/* @once */ Button({ variant: 'outline' })}
								>
									View members
								</button>
							);
						})()}

						<div class="grow"></div>

						{(() => {
							if (isModList() && list.uid === list.creator.uid) {
								return (
									<button
										title="Edit this list"
										onClick={() => {
											openPaneModal(() => <ListSettingsPaneDialog list={list} />);
										}}
										class={/* @once */ Button({ variant: 'outline' })}
									>
										<EditIcon class="-mx-1.5 text-base" />
									</button>
								);
							}
						})()}

						<ListOverflowAction list={list}>
							<button title="Actions" class={/* @once */ Button({ variant: 'outline' })}>
								<MoreHorizIcon class="-mx-1.5 text-base" />
							</button>
						</ListOverflowAction>
					</div>
				</div>
			</VirtualContainer>
		);
	}) as unknown as JSX.Element;
};

export default ListHeader;
