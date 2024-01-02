import Checkbox from '~/com/components/inputs/Checkbox.tsx';

import { modelChecked } from '~/utils/input.ts';

import type { CustomFeedPaneConfig } from '~/desktop/globals/panes.ts';

import { usePaneContext } from '../PaneContext.tsx';

const CustomFeedPaneSettings = () => {
	const { pane } = usePaneContext<CustomFeedPaneConfig>();

	return (
		<div class="flex flex-col border-b border-divider pb-5">
			<p class="p-4 text-sm font-bold">Filter</p>

			<div class="mx-4 flex flex-col gap-2 text-sm">
				<label class="flex items-center justify-between gap-2">
					<span>Show replies</span>
					<Checkbox
						ref={modelChecked(
							() => pane.showReplies,
							(next) => (pane.showReplies = next),
						)}
					/>
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Show quotes</span>
					<Checkbox
						ref={modelChecked(
							() => pane.showQuotes,
							(next) => (pane.showQuotes = next),
						)}
					/>
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Show reposts</span>
					<Checkbox
						ref={modelChecked(
							() => pane.showReposts,
							(next) => (pane.showReposts = next),
						)}
					/>
				</label>
			</div>
		</div>
	);
};

export default CustomFeedPaneSettings;
