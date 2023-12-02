import { createRadioModel } from '~/utils/input.ts';
import { getUniqueId } from '~/utils/misc.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import Radio from '~/com/components/inputs/Radio.tsx';

const AppearanceView = () => {
	const themeId = getUniqueId();

	const ui = preferences.ui;

	const themeModel = createRadioModel(
		() => ui.theme,
		(next) => (ui.theme = next),
	);

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 px-4">
				<h2 class="grow text-base font-bold">Appearance</h2>
			</div>
			<div class="grow overflow-y-auto">
				<div class="flex flex-col gap-3 px-4 py-3 text-sm">
					<p class="font-bold">Theme</p>

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
			</div>
		</div>
	);
};

export default AppearanceView;
