import { modelChecked } from '~/utils/input.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import Checkbox from '~/com/components/inputs/Checkbox.tsx';

const AccessibilityView = () => {
	const prefs = preferences.a11y;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Appearance</h2>
			</div>
			<div class="grow overflow-y-auto">
				<p class="p-4 text-base font-bold leading-5">Media</p>

				<div class="px-4 py-3">
					<label class="flex min-w-0 justify-between gap-4">
						<span class="text-sm">Remind me for image descriptions</span>

						<Checkbox
							ref={modelChecked(
								() => prefs.warnNoMediaAlt,
								(next) => (prefs.warnNoMediaAlt = next),
							)}
						/>
					</label>

					<p class="mr-6 text-de text-muted-fg">
						Show a reminder when posting an image without a description
					</p>
				</div>
			</div>
		</div>
	);
};

export default AccessibilityView;
