import { type JSX, createSignal, lazy } from 'solid-js';

import type { At } from '@atcute/client/lexicons';
import { createQuery } from '@mary/solid-query';

import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info';

import { IconButton } from '~/com/primitives/icon-button';

import { VirtualContainer } from '~/com/components/VirtualContainer';
import TimelineList from '~/com/components/lists/TimelineList';

import InfoOutlinedIcon from '~/com/icons/outline-info';
import SettingsOutlinedIcon from '~/com/icons/outline-settings';

import type { CustomFeedPaneConfig } from '../../../globals/panes';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import { usePaneContext } from '../PaneContext';
import FeedHeader from '../partials/FeedHeader';

const CustomFeedPaneSettings = lazy(() => import('../settings/CustomFeedPaneSettings'));
const GenericPaneSettings = lazy(() => import('../settings/GenericPaneSettings'));

const CustomFeedPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<CustomFeedPaneConfig>();

	return [
		<Pane
			title={pane.feed.name}
			subtitle="Feed"
			actions={
				<>
					<button
						title={`${pane.infoVisible ? `Hide` : `Show`} feed information`}
						onClick={() => (pane.infoVisible = !pane.infoVisible)}
						class={/* @once */ IconButton({ color: 'muted' })}
					>
						<InfoOutlinedIcon />
					</button>

					<button
						title="Column settings"
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsOutlinedIcon />
					</button>
				</>
			}
		>
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

const FeedHeaderAccessory = (props: { uid: At.DID; uri: string }) => {
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
