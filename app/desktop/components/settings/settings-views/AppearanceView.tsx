import { createRadioModel } from '~/utils/input.ts';
import { getUniqueId } from '~/utils/misc.ts';

import { PaneSize } from '~/desktop/globals/panes.ts';
import { preferences } from '~/desktop/globals/settings.ts';

import Radio from '~/com/components/inputs/Radio.tsx';

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
			</div>
		</div>
	);
};

export default AppearanceView;
