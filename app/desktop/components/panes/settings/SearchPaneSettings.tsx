import TextareaAutoresize from 'solid-textarea-autosize';

import type { SearchPaneConfig } from '../../../globals/panes';

import { Textarea } from '~/com/primitives/textarea';

import SearchIcon from '~/com/icons/baseline-search';

import { usePaneContext } from '../PaneContext';

const SearchPaneSettings = () => {
	const { pane } = usePaneContext<SearchPaneConfig>();

	return (
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
	);
};

export default SearchPaneSettings;
