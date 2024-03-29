import { type JSX, createMemo } from 'solid-js';

import { clsx } from '~/utils/misc';

import { PaneSize, SpecificPaneSize } from '../../globals/panes';
import { preferences } from '../../globals/settings';

import { usePaneContext } from './PaneContext';

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
			class={clsx([
				`flex shrink-0 flex-col bg-background`,
				size() === PaneSize.SMALL && `w-84`,
				size() === PaneSize.MEDIUM && `w-96`,
				size() === PaneSize.LARGE && `w-120`,
			])}
		>
			{props.children}
		</div>
	);
};

export default Pane;
