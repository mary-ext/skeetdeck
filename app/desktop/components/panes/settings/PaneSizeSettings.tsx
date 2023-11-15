import { getUniqueId } from '~/utils/misc.ts';

import Radio from '~/com/components/inputs/Radio.tsx';

import { SpecificPaneSize } from '../../../globals/panes.ts';

import { usePaneContext } from '../PaneContext.tsx';

const PaneSizeSettings = () => {
	const { pane } = usePaneContext();

	const id = getUniqueId();

	return (
		<div class="flex flex-col border-b border-divider pb-5">
			<p class="p-4 text-sm font-bold">Column width</p>

			<div class="mx-4 flex flex-col gap-2 text-sm">
				<label class="flex items-center justify-between gap-2">
					<span>Use default width</span>
					<Radio
						name={id}
						checked={pane.size === SpecificPaneSize.INHERIT}
						onChange={() => (pane.size = SpecificPaneSize.INHERIT)}
					/>
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Small</span>
					<Radio
						name={id}
						checked={pane.size === SpecificPaneSize.SMALL}
						onChange={() => (pane.size = SpecificPaneSize.SMALL)}
					/>
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Medium</span>
					<Radio
						name={id}
						checked={pane.size === SpecificPaneSize.MEDIUM}
						onChange={() => (pane.size = SpecificPaneSize.MEDIUM)}
					/>
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Large</span>
					<Radio
						name={id}
						checked={pane.size === SpecificPaneSize.LARGE}
						onChange={() => (pane.size = SpecificPaneSize.LARGE)}
					/>
				</label>
			</div>
		</div>
	);
};

export default PaneSizeSettings;
