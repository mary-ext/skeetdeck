import { type JSX, createSignal, lazy } from 'solid-js';

import { getAccountHandle } from '~/api/globals/agent';

import type { SearchPaneConfig } from '../../../globals/panes';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';

import SettingsOutlinedIcon from '~/com/icons/outline-settings';

import { usePaneContext } from '../PaneContext';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';

const GenericPaneSettings = lazy(() => import('../settings/GenericPaneSettings'));
const SearchPaneSettings = lazy(() => import('../settings/SearchPaneSettings'));

const SearchPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<SearchPaneConfig>();

	return [
		<Pane
			title={pane.query}
			subtitle="Search"
			actions={
				<>
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
				<TimelineList
					uid={pane.uid}
					params={{
						type: 'search',
						query: transformSearchQuery(pane.query, {
							handle: getAccountHandle(pane.uid),
						}),
					}}
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

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const transformSearchQuery = (query: string, { handle }: { handle: string | null }) => {
	// https://github.com/bluesky-social/indigo/blob/421e4da5307f4fcba51f25b5c5982c8b9841f7f6/search/parse_query.go#L15-L21
	let quoted = false;
	const parts = fieldsfunc(query, (rune) => {
		if (rune === 34) {
			quoted = !quoted;
		}

		return rune === 32 && !quoted;
	});

	for (let i = 0, il = parts.length; i < il; i++) {
		const part = parts[i];

		if (part.charCodeAt(0) === 34) {
			continue;
		}

		const colon_index = part.indexOf(':');
		if (colon_index === -1) {
			continue;
		}

		const operator = part.slice(0, colon_index);
		const value = part.slice(colon_index + 1);

		if (operator === 'since' || operator === 'until') {
			const match = DATE_RE.exec(value);
			if (match === null) {
				continue;
			}

			const s = operator === 'since';

			const [, year, month, day] = match;
			const date = new Date(+year, +month - 1, +day, s ? 0 : 23, s ? 0 : 59, s ? 0 : 59, s ? 0 : 999);

			if (Number.isNaN(date.getTime())) {
				continue;
			}

			parts[i] = `${operator}:${date.toISOString()}`;
		} else if (
			handle !== null &&
			value === 'me' &&
			(operator === 'from' || operator === 'to' || operator === 'mentions')
		) {
			// Remove this once backend passes around the viewer parameter
			parts[i] = `${operator}:${handle}`;
		}
	}

	return parts.join(' ');
};

// https://github.com/golang/go/blob/519f6a00e4dabb871eadaefc8ac295c09fd9b56f/src/strings/strings.go#L377-L425
const fieldsfunc = (str: string, fn: (rune: number) => boolean): string[] => {
	const slices: string[] = [];

	let start = -1;
	for (let pos = 0, len = str.length; pos < len; pos++) {
		if (fn(str.charCodeAt(pos))) {
			if (start !== -1) {
				slices.push(str.slice(start, pos));
				start = -1;
			}
		} else {
			if (start === -1) {
				start = pos;
			}
		}
	}

	if (start !== -1) {
		slices.push(str.slice(start));
	}

	return slices;
};
