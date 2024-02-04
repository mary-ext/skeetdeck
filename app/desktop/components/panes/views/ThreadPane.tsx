import { type JSX, createMemo, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import { getInitialPostThread, getPostThread, getPostThreadKey } from '~/api/queries/get-post-thread.ts';

import { type ThreadPaneConfig, SpecificPaneSize } from '../../../globals/panes.ts';
import { preferences } from '../../../globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import ThreadView from '../partials/ThreadView.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

const ThreadPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<ThreadPaneConfig>();

	const ui = preferences.ui;

	const size = createMemo(() => {
		const $size = pane.size;

		if ($size === SpecificPaneSize.INHERIT) {
			return preferences.ui.defaultPaneSize;
		}

		return $size;
	});

	const thread = createQuery(() => {
		const data = pane.thread;

		const isLarge = ui.threadedReplies && size() === SpecificPaneSize.LARGE;
		const key = getPostThreadKey(pane.uid, data.actor, data.rkey, !isLarge ? 4 : 6, 10);

		return {
			queryKey: key,
			queryFn: getPostThread,
			placeholderData: () => getInitialPostThread(key),
		};
	});

	return [
		<Pane>
			<PaneHeader title="Thread">
				<button
					title="Column settings"
					onClick={() => setIsSettingsOpen(!isSettingsOpen())}
					class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
				>
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				<ThreadView actor={pane.thread.actor} thread={thread} />
			</PaneBody>
		</Pane>,

		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default ThreadPane;
