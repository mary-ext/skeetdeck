import { createMemo, type JSX } from 'solid-js';

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
			class="flex h-full flex-col bg-background"
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

export default PaneDialog;
