import { Show } from 'solid-js';

import TextareaAutoresize from 'solid-textarea-autosize';

import type { SearchPaneConfig } from '../../../globals/panes.ts';

import { Input } from '~/com/primitives/input.ts';
import { Textarea } from '~/com/primitives/textarea.ts';

import Checkbox from '~/com/components/inputs/Checkbox.tsx';

import SearchIcon from '~/com/icons/baseline-search.tsx';

import { usePaneContext } from '../PaneContext.tsx';

const SearchPaneSettings = () => {
	const { pane } = usePaneContext<SearchPaneConfig>();

	return (
		<div class="contents">
			<div class="border-b border-divider p-4">
				<div class="relative grow">
					<div class="pointer-events-none absolute inset-y-0 ml-px grid place-items-center px-2">
						<SearchIcon class="text-lg text-muted-fg" />
					</div>
					<TextareaAutoresize
						class={/* @once */ Textarea({ class: 'pl-8' })}
						value={pane.query}
						placeholder="Search..."
						minRows={1}
						onKeyDown={(ev) => {
							if (ev.key === 'Enter') {
								const value = ev.currentTarget.value.trim();

								if (value) {
									pane.query = value;
								} else {
									ev.currentTarget.value = pane.query;
								}

								ev.preventDefault();
							}
						}}
					/>
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
		</div>
	);
};

export default SearchPaneSettings;
