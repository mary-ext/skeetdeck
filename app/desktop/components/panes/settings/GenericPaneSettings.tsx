import { Show } from 'solid-js';

import { multiagent } from '~/api/globals/agent.ts';

import { getUniqueId } from '~/utils/misc.ts';

import { SpecificPaneSize } from '../../../globals/panes.ts';

import Radio from '~/com/components/inputs/Radio.tsx';
import { Interactive } from '~/com/primitives/interactive.ts';

import DeleteIcon from '~/com/icons/baseline-delete.tsx';
import SyncAltIcon from '~/com/icons/baseline-sync-alt.tsx';

import { usePaneContext } from '../PaneContext.tsx';

const GenericPaneSettings = () => {
	const { pane, deletePane } = usePaneContext();

	const id = getUniqueId();

	return (
		<div class="contents">
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

			<Show when={multiagent.accounts.length > 1}>
				<button
					class={/* @once */ Interactive({ class: 'flex items-center gap-4 border-b border-divider p-4' })}
				>
					<SyncAltIcon class="text-lg" />
					<span class="text-sm">Switch accounts</span>
				</button>
			</Show>

			<button
				onClick={deletePane}
				class={
					/* @once */ Interactive({
						class: 'flex items-center gap-4 border-b border-divider p-4 text-red-500',
					})
				}
			>
				<DeleteIcon class="text-lg" />
				<span class="text-sm">Delete this column</span>
			</button>
		</div>
	);
};

export default GenericPaneSettings;
