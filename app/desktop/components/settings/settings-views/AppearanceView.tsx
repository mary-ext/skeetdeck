import { createRadioModel } from '~/utils/input.ts';
import { getUniqueId } from '~/utils/misc.ts';

import { PaneSize } from '~/desktop/globals/panes.ts';
import { preferences } from '~/desktop/globals/settings.ts';

import Radio from '~/com/components/inputs/Radio.tsx';
import Checkbox from '~/com/components/inputs/Checkbox.tsx';

const AppearanceView = () => {
	const ui = preferences.ui;

	const themeId = getUniqueId();
	const themeModel = createRadioModel(
		() => ui.theme,
		(next) => (ui.theme = next),
	);

	const columnSizeId = getUniqueId();
	const paneSizeModel = createRadioModel(
		() => ui.defaultPaneSize,
		(next) => (ui.defaultPaneSize = next),
	);

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Appearance</h2>
			</div>
			<div class="grow overflow-y-auto">
				<div class="flex flex-col gap-3 px-4 py-3 text-sm">
					<p class="font-medium leading-6 text-primary">Theme</p>

					<label class="flex items-center justify-between gap-2">
						<span>Automatic</span>
						<Radio ref={themeModel('auto')} name={themeId} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Light</span>
						<Radio ref={themeModel('light')} name={themeId} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Dark</span>
						<Radio ref={themeModel('dark')} name={themeId} />
					</label>
				</div>

				<div class="flex flex-col gap-3 px-4 py-3 text-sm">
					<p class="font-medium leading-6 text-primary">Default column size</p>

					<label class="flex items-center justify-between gap-2">
						<span>Small</span>
						<Radio ref={paneSizeModel(PaneSize.SMALL)} name={columnSizeId} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Medium</span>
						<Radio ref={paneSizeModel(PaneSize.MEDIUM)} name={columnSizeId} />
					</label>
					<label class="flex items-center justify-between gap-2">
						<span>Large</span>
						<Radio ref={paneSizeModel(PaneSize.LARGE)} name={columnSizeId} />
					</label>
				</div>

				<hr class="mx-4 mb-2 mt-1 border-divider" />

				<div class="px-4 py-3">
					<label class="flex min-w-0 justify-between gap-4">
						<span class="text-sm">Show profile media in grid form</span>

						<Checkbox
							checked={ui.profileMediaGrid}
							onChange={(ev) => {
								const next = ev.target.checked;
								ui.profileMediaGrid = next;
							}}
						/>
					</label>

					<p class="mr-6 text-de text-muted-fg">This preference will not affect feeds/lists panes</p>
				</div>

				<div class="px-4 py-3">
					<label class="flex min-w-0 justify-between gap-4">
						<span class="text-sm">Show thread replies in threaded form</span>

						<Checkbox
							checked={ui.threadedReplies}
							onChange={(ev) => {
								const next = ev.target.checked;
								ui.threadedReplies = next;
							}}
						/>
					</label>

					<p class="mr-6 text-de text-muted-fg">This is an experimental feature.</p>
				</div>
			</div>
		</div>
	);
};

export default AppearanceView;
