import { type JSX, createSignal, lazy } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info.ts';

import { openModal } from '~/com/globals/modals.tsx';

import type { CustomListPaneConfig } from '../../../globals/panes.ts';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import { Link, LinkingType } from '~/com/components/Link.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import InfoIcon from '~/com/icons/baseline-info.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import DefaultAvatar from '~/com/assets/default-user-avatar.svg?url';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

import ListMembersPaneDialog from '../dialogs/ListMembersPaneDialog.tsx';
import ListSettingsPaneDialog from '../dialogs/ListSettingsPaneDialog.tsx';

const LazyImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog.tsx'));

const CustomListPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<CustomListPaneConfig>();

	return [
		<Pane>
			<PaneHeader title={pane.list.name} subtitle="User list">
				<button
					title={`${pane.infoVisible ? `Hide` : `Show`} list information`}
					onClick={() => (pane.infoVisible = !pane.infoVisible)}
					class={/* @once */ IconButton({ color: 'muted' })}
				>
					<InfoIcon />
				</button>

				<button
					title="Column settings"
					onClick={() => setIsSettingsOpen(!isSettingsOpen())}
					class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
				>
					<SettingsIcon />
				</button>
			</PaneHeader>

			<PaneBody>
				{(() => {
					if (pane.infoVisible) {
						return <ListHeader uid={pane.uid} uri={pane.list.uri} />;
					}
				})()}

				<TimelineList uid={pane.uid} params={{ type: 'list', uri: pane.list.uri }} />
			</PaneBody>
		</Pane>,

		(() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		}) as unknown as JSX.Element,
	];
};

export default CustomListPane;

const ListHeader = (props: { uid: DID; uri: string }) => {
	const { openModal: openPaneModal } = usePaneContext();

	const list = createQuery(() => {
		const key = getListInfoKey(props.uid, props.uri);

		return {
			queryKey: key,
			queryFn: getListInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialListInfo(key),
		};
	});

	return (() => {
		const data = list.data;

		if (data) {
			const creator = data.creator;

			return (
				<VirtualContainer class="shrink-0">
					<div class="flex flex-col gap-4 border-b border-divider p-4">
						<div class="flex gap-4">
							{(() => {
								const avatar = data.avatar.value;

								if (avatar) {
									return (
										<button
											onClick={() => {
												openModal(() => <LazyImageViewerDialog images={[{ fullsize: avatar }]} />);
											}}
											class="group h-13 w-13 shrink-0 overflow-hidden rounded-md bg-background"
										>
											<img src={avatar} class="h-full w-full object-cover group-hover:opacity-75" />
										</button>
									);
								}

								return <div class="h-13 w-13 shrink-0 rounded-md bg-muted-fg"></div>;
							})()}

							<div class="grow">
								<p class="break-words text-lg font-bold">{data.name.value}</p>

								<Link
									to={/* @once */ { type: LinkingType.PROFILE, actor: creator.did }}
									class="group mt-1 flex items-center text-left"
								>
									<img src={creator.avatar.value || DefaultAvatar} class="mr-2 h-5 w-5 rounded-full" />
									<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
										{creator.displayName.value}
									</span>
									<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
										@{creator.handle.value}
									</span>
								</Link>
							</div>
						</div>

						<p class="whitespace-pre-wrap break-words text-sm empty:hidden">{data.description.value}</p>

						<div class="flex gap-2">
							{(() => {
								if (props.uid === data.creator.uid) {
									return (
										<button
											onClick={() => {
												openPaneModal(() => <ListSettingsPaneDialog list={data} />);
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
											openPaneModal(() => <ListMembersPaneDialog list={data} />);
										}}
										class={/* @once */ Button({ variant: 'outline' })}
									>
										View members
									</button>
								);
							})()}
						</div>
					</div>
				</VirtualContainer>
			);
		}

		return (
			<div class="shrink-0 border-b border-divider" style="height:172.8px">
				<div class="m-4 h-13 w-13 shrink-0 rounded-md bg-secondary/20"></div>
			</div>
		);
	}) as unknown as JSX.Element;
};
