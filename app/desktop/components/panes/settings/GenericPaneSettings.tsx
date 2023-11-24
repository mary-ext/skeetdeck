import { Show } from 'solid-js';

import { multiagent } from '~/api/globals/agent.ts';

import { getUniqueId } from '~/utils/misc.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { SpecificPaneSize } from '../../../globals/panes.ts';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';
import Checkbox from '~/com/components/inputs/Checkbox.tsx';
import Radio from '~/com/components/inputs/Radio.tsx';
import { Input } from '~/com/primitives/input.ts';
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

			<div class="border-b border-divider">
				<label class="flex items-center justify-between gap-4 p-4">
					<span class="text-sm">Rename column</span>
					<Checkbox
						checked={pane.title !== null}
						onChange={(ev) => {
							pane.title = !ev.currentTarget.checked ? null : '';
						}}
					/>
				</label>

				<Show when={pane.title !== null}>
					<div class="p-4 pt-0">
						<input
							class={/* @once */ Input()}
							value={pane.title!}
							onKeyDown={(ev) => {
								if (ev.key === 'Enter') {
									const value = ev.currentTarget.value.trim();

									if (value) {
										pane.title = value;
									} else {
										ev.currentTarget.value = pane.title!;
									}

									ev.preventDefault();
								}
							}}
						/>
					</div>
				</Show>
			</div>

			<Show when={multiagent.accounts.length > 1}>
				<button
					class={
						/* @once */ Interactive({
							variant: 'muted',
							class: 'flex items-center gap-4 border-b border-divider p-4',
						})
					}
				>
					<SyncAltIcon class="text-lg" />
					<span class="text-sm">Switch accounts</span>
				</button>
			</Show>

			<button
				onClick={() => {
					openModal(() => (
						<ConfirmDialog
							title="Delete column?"
							body="This can't be undone, the column will be deleted from this deck."
							confirmation="Delete"
							onConfirm={deletePane}
						/>
					));
				}}
				class={
					/* @once */ Interactive({
						variant: 'muted',
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
