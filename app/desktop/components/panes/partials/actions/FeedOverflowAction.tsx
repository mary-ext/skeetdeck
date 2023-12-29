import type { JSX } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedFeed } from '~/api/stores/feeds.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu.ts';

import ReportDialog from '~/com/components/dialogs/ReportDialog.tsx';
import { Flyout } from '~/com/components/Flyout.tsx';

import LaunchIcon from '~/com/icons/baseline-launch.tsx';
import ReportIcon from '~/com/icons/baseline-report.tsx';

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
