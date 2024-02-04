import { type JSX, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info.ts';

import type { CustomFeedPaneConfig } from '../../../globals/panes.ts';

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

import CustomFeedPaneSettings from '../settings/CustomFeedPaneSettings.tsx';
import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

import FeedHeader from '../partials/FeedHeader.tsx';

const CustomFeedPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<CustomFeedPaneConfig>();

	return [
		<Pane>
			<PaneHeader title={pane.feed.name} subtitle="Feed">
				<button
					title={`${pane.infoVisible ? `Hide` : `Show`} feed information`}
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
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				{(() => {
					if (pane.infoVisible) {
						return <FeedHeaderAccessory uid={pane.uid} uri={pane.feed.uri} />;
					}
				})()}

				<TimelineList
					uid={pane.uid}
					params={{
						type: 'feed',
						uri: pane.feed.uri,
						showReplies: pane.showReplies,
						showReposts: pane.showReposts,
						showQuotes: pane.showQuotes,
					}}
				/>
			</PaneBody>
		</Pane>,
		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<CustomFeedPaneSettings />
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default CustomFeedPane;

const FeedHeaderAccessory = (props: { uid: DID; uri: string }) => {
	const list = createQuery(() => {
		const key = getFeedInfoKey(props.uid, props.uri);

		return {
			queryKey: key,
			queryFn: getFeedInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialFeedInfo(key),
		};
	});

	return (
		<VirtualContainer class="shrink-0">
			<FeedHeader feed={list.data} />
			<hr class="border-divider" />
		</VirtualContainer>
	);
};
