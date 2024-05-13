import TextareaAutoresize from 'solid-textarea-autosize';

import { getUniqueId } from '~/utils/misc';

import type { SearchPaneConfig } from '../../../globals/panes';

import Radio from '~/com/components/inputs/Radio';
import SearchIcon from '~/com/icons/baseline-search';
import { Textarea } from '~/com/primitives/textarea';

import { usePaneContext } from '../PaneContext';

const SearchPaneSettings = () => {
	const { pane } = usePaneContext<SearchPaneConfig>();

	const id = getUniqueId();

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

			<div class="flex flex-col border-b border-divider pb-5">
				<p class="p-4 text-sm font-bold">Order by</p>

				<div class="mx-4 flex flex-col gap-2 text-sm">
					<label class="flex items-center justify-between gap-2">
						<span>Latest</span>
						<Radio name={id} checked={pane.sort === 'latest'} onChange={() => (pane.sort = 'latest')} />
					</label>

					<label class="flex items-center justify-between gap-2">
						<span>Top</span>
						<Radio name={id} checked={pane.sort === 'top'} onChange={() => (pane.sort = 'top')} />
					</label>
				</div>
			</div>
		</div>
	);
};

export default SearchPaneSettings;
