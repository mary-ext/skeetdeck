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

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

import DefaultAvatar from '~/com/assets/default-avatar.svg';

import ListFormDialog from '../../dialogs/ListFormDialog.tsx';

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
					<div class="border-b border-divider">
						{(() => {
							const avatar = data.avatar.value;

							if (avatar) {
								return (
									<button
										onClick={() => {
											openModal(() => <LazyImageViewerDialog images={[{ fullsize: avatar }]} />);
										}}
										class="group block aspect-banner bg-background"
									>
										<img src={avatar} class="h-full w-full object-cover group-hover:opacity-75" />
									</button>
								);
							}

							return <div class="aspect-banner bg-muted-fg"></div>;
						})()}

						<div class="flex flex-col items-center gap-3 p-3">
							<p class="text-center text-lg font-bold">{data.name.value}</p>
							<p class="whitespace-pre-wrap break-words text-center text-sm empty:hidden">
								{data.description.value}
							</p>

							<Link
								to={/* @once */ { type: LinkingType.PROFILE, actor: creator.did }}
								class="group flex items-center text-left"
							>
								<img src={creator.avatar.value || DefaultAvatar} class="mr-2 h-5 w-5 rounded-full" />
								<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
									{creator.displayName.value}
								</span>
								<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
									@{creator.handle.value}
								</span>
							</Link>

							{(() => {
								if (props.uid === data.creator.uid) {
									return (
										<div class="my-1 flex gap-3">
											<button
												onClick={() => {
													openModal(() => <ListFormDialog uid={props.uid} list={data} />);
												}}
												class={/* @once */ Button({ variant: 'outline' })}
											>
												Edit list
											</button>
										</div>
									);
								}
							})()}
						</div>
					</div>
				</VirtualContainer>
			);
		}

		return (
			<div class="shrink-0 border-b border-divider">
				<div class="aspect-banner bg-secondary/20"></div>
				<div style="height:172px"></div>
			</div>
		);
	}) as unknown as JSX.Element;
};
