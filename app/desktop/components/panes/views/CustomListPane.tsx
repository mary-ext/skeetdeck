import { type JSX, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info.ts';

import type { CustomListPaneConfig } from '../../../globals/panes.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import InfoIcon from '~/com/icons/baseline-info.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

import ListHeader from '../partials/ListHeader.tsx';

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
						return <ListHeaderAccessory uid={pane.uid} uri={pane.list.uri} />;
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

const ListHeaderAccessory = (props: { uid: DID; uri: string }) => {
	const list = createQuery(() => {
		const key = getListInfoKey(props.uid, props.uri);

		return {
			queryKey: key,
			queryFn: getListInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialListInfo(key),
		};
	});

	return (
		<VirtualContainer class="shrink-0">
			<ListHeader list={list.data} />
			<hr class="border-divider" />
		</VirtualContainer>
	);
};
