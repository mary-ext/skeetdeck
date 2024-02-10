import { type JSX, createSignal } from 'solid-js';

import type { SearchPaneConfig } from '../../../globals/panes';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';

import SettingsIcon from '~/com/icons/baseline-settings';

import { usePaneContext } from '../PaneContext';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import PaneHeader from '../PaneHeader';

import GenericPaneSettings from '../settings/GenericPaneSettings';
import SearchPaneSettings from '../settings/SearchPaneSettings';

const augmentSearchQuery = (query: string, { did }: { did: string }) => {
	// We don't want to replace substrings that are being "quoted" because those
	// are exact string matches, so what we'll do here is to split them apart

	// Even-indexed strings are unquoted, odd-indexed strings are quoted
	const splits = query.split(/("(?:[^"\\]|\\.)*")/g);

	return splits
		.map((str, idx) => {
			if (idx % 2 === 0) {
				return str.replaceAll(/(^|\s)from:me(\s|$)/g, `$1${did}$2`);
			}

			return str;
		})
		.join('');
};

const SearchPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<SearchPaneConfig>();

	return [
		<Pane>
			<PaneHeader title={pane.query} subtitle="Search">
				<button
					title="Column settings"
					onClick={() => setIsSettingsOpen(!isSettingsOpen())}
					class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
				>
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				<TimelineList
					uid={pane.uid}
					params={{ type: 'search', query: augmentSearchQuery(pane.query, { did: pane.uid }) }}
				/>
			</PaneBody>
		</Pane>,

		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<SearchPaneSettings />
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default SearchPane;
