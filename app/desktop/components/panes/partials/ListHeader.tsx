import { lazy, type JSX } from 'solid-js';

import type { SignalizedList } from '~/api/stores/lists';

import { openModal } from '~/com/globals/modals';

import { LINK_PROFILE, Link } from '~/com/components/Link';
import RichTextRenderer from '~/com/components/RichTextRenderer';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import EditOutlinedIcon from '~/com/icons/outline-edit';
import { BoxedIconButton } from '~/com/primitives/boxed-icon-button';
import { Button } from '~/com/primitives/button';

import DefaultListAvatar from '~/com/assets/default-list-avatar.svg?url';
import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { usePaneContext } from '../PaneContext';

import ListOverflowAction from './actions/ListOverflowAction';

const ImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog'));
const SubscribeListDialog = lazy(() => import('~/com/components/dialogs/lists/SubscribeListDialog'));

const ListMembersPaneDialog = lazy(() => import('../dialogs/ListMembersPaneDialog'));
const ListSettingsPaneDialog = lazy(() => import('../dialogs/ListSettingsPaneDialog'));

export interface ListHeaderProps {
	list?: SignalizedList;
}

const ListHeader = (props: ListHeaderProps) => {
	const { openModal: openPaneModal } = usePaneContext();

	return (() => {
		const list = props.list;

		if (!list) {
			return (
				<div class="shrink-0 p-4" style="height:172px">
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
								class="group mt-1 flex items-center"
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
						<RichTextRenderer text={list.description.value ?? ''} facets={list.descriptionFacets.value} />
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

						{
							/* @once */ list.uid === list.creator.uid && (
								<button
									title="Edit this list"
									onClick={() => {
										openPaneModal(() => <ListSettingsPaneDialog list={list} />);
									}}
									class={/* @once */ BoxedIconButton()}
								>
									<EditOutlinedIcon />
								</button>
							)
						}

						<ListOverflowAction list={list}>
							<button title="Actions" class={/* @once */ BoxedIconButton()}>
								<MoreHorizIcon />
							</button>
						</ListOverflowAction>
					</div>
				</div>
			</VirtualContainer>
		);
	}) as unknown as JSX.Element;
};

export default ListHeader;
