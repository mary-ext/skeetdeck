import { type JSX, createMemo } from 'solid-js';

import { clsx } from '~/utils/misc.ts';

import { preferences } from '../../globals/settings.ts';
import { PaneSize, SpecificPaneSize } from '../../globals/panes.ts';

import { usePaneContext } from './PaneContext.tsx';

export interface PaneDialogProps {
	children?: JSX.Element;
}

const PaneDialog = (props: PaneDialogProps) => {
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
				`flex h-full flex-col bg-background`,
				size() === PaneSize.SMALL && `w-84`,
				size() === PaneSize.MEDIUM && `w-96`,
				size() === PaneSize.LARGE && `w-120`,
			])}
		>
			{props.children}
		</div>
	);
};

export default PaneDialog;
