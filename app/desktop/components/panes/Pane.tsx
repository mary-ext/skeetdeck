import { type JSX, createMemo } from 'solid-js';

import { PaneSize, SpecificPaneSize } from '~/desktop/globals/panes.ts';
import { preferences } from '~/desktop/globals/settings.ts';

import { usePaneContext } from './PaneContext.tsx';

export interface PaneProps {
	children?: JSX.Element;
}

const Pane = (props: PaneProps) => {
	const { pane } = usePaneContext();

	const size = createMemo(() => {
		const $size = pane.size;

		if ($size === SpecificPaneSize.INHERIT) {
			return preferences.ui.defaultPaneSize;
		}

		return $size;
	});

	return (
		<div
			class="flex shrink-0 flex-col bg-background"
			classList={{
				[`w-84`]: size() === PaneSize.SMALL,
				[`w-96`]: size() === PaneSize.MEDIUM,
				[`w-120`]: size() === PaneSize.LARGE,
			}}
		>
			{props.children}
		</div>
	);
};

export default Pane;
