import Checkbox from '~/com/components/inputs/Checkbox.tsx';

import { modelChecked } from '~/utils/input.ts';

import type { HomePaneConfig } from '~/desktop/globals/panes.ts';

import { usePaneContext } from '../PaneContext.tsx';

const HomePaneSettings = () => {
	const { pane } = usePaneContext<HomePaneConfig>();

	return (
		<div class="flex flex-col border-b border-divider pb-5">
			<p class="p-4 text-sm font-bold">Filter</p>

			<div class="mx-4 flex flex-col gap-2 text-sm">
				<label class="flex items-center justify-between gap-2">
					<span>Show replies</span>
					<Checkbox
						ref={modelChecked(
							() => pane.showReplies !== false,
							(next) => (pane.showReplies = next),
						)}
					/>
				</label>

				<fieldset disabled={pane.showReplies === false} class="disabled:opacity-50">
					<label class="flex items-center justify-between gap-2">
						<span>Show followed replies only</span>
						<Checkbox
							ref={modelChecked(
								() => pane.showReplies === 'follows',
								(next) => (pane.showReplies = next ? 'follows' : true),
							)}
						/>
					</label>
				</fieldset>

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

export default HomePaneSettings;
