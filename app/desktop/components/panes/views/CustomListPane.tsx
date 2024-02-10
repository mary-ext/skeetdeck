import { type JSX, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info';

import type { CustomListPaneConfig } from '../../../globals/panes';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import InfoIcon from '~/com/icons/baseline-info';
import SettingsIcon from '~/com/icons/baseline-settings';

import { usePaneContext } from '../PaneContext';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import PaneHeader from '../PaneHeader';

import CustomListPaneSettings from '../settings/CustomListPaneSettings';
import GenericPaneSettings from '../settings/GenericPaneSettings';

import ListHeader from '../partials/ListHeader';

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

				<TimelineList
					uid={pane.uid}
					params={{
						type: 'list',
						uri: pane.list.uri,
						showReplies: pane.showReplies,
						showQuotes: pane.showQuotes,
					}}
				/>
			</PaneBody>
		</Pane>,

		(() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<CustomListPaneSettings />
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
