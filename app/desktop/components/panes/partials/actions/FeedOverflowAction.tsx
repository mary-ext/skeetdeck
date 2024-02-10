import { type JSX, lazy } from 'solid-js';

import { getRecordId } from '~/api/utils/misc';

import type { SignalizedFeed } from '~/api/stores/feeds';

import { openModal } from '~/com/globals/modals';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { Flyout } from '~/com/components/Flyout';

import LaunchIcon from '~/com/icons/baseline-launch';
import ReportIcon from '~/com/icons/baseline-report';

const ReportDialog = lazy(() => import('~/com/components/dialogs/ReportDialog'));

export interface FeedOverflowActionProps {
	feed: SignalizedFeed;
	children: JSX.Element;
}

const FeedOverflowAction = (props: FeedOverflowActionProps) => {
	return (() => {
		const feed = props.feed;
		const creator = feed.creator;

		return (
			<Flyout button={props.children} placement="bottom-end">
				{({ close, menuProps }) => (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<a
							href={`https://bsky.app/profile/${creator.did}/feed/${getRecordId(feed.uri)}`}
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

								openModal(() => (
									<ReportDialog
										uid={/* @once */ feed.uid}
										report={/* @once */ { type: 'feed', uri: feed.uri, cid: feed.cid.value }}
									/>
								));
							}}
							class={/* @once */ MenuItem()}
						>
							<ReportIcon class={/* @once */ MenuItemIcon()} />
							<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report feed</span>
						</button>
					</div>
				)}
			</Flyout>
		);
	}) as unknown as JSX.Element;
};

export default FeedOverflowAction;
