import { createRadioModel, modelChecked } from '~/utils/input';
import { getUniqueId } from '~/utils/misc';

import { PaneSize } from '~/desktop/globals/panes';
import { preferences } from '~/desktop/globals/settings';

import { ListBox, ListBoxItemReadonly, ListGroup, ListGroupHeader } from '~/com/primitives/list-box';

import Radio from '~/com/components/inputs/Radio';
import Checkbox from '~/com/components/inputs/Checkbox';
import type { SelectOption } from '../../flyouts/SelectAction';

const getThemeOptions = () => {
	const options: SelectOption<'auto' | 'light' | 'dark'>[] = [
		{
			value: 'auto',
			label: 'System default',
		},
		{
			value: 'light',
			label: 'Light',
		},
		{
			value: 'dark',
			label: 'dark',
		},
	];

	return options;
};

const AppearanceView = () => {
	const ui = preferences.ui;
	const a11y = preferences.a11y;

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
				<h2 class="grow text-base font-bold">Interface</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<p class={ListGroupHeader}>Appearance</p>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Automatic</span>
							<Radio ref={themeModel('auto')} name={themeId} />
						</label>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Light</span>
							<Radio ref={themeModel('light')} name={themeId} />
						</label>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Dark</span>
							<Radio ref={themeModel('dark')} name={themeId} />
						</label>
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Default column size</p>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Small</span>
							<Radio ref={paneSizeModel(PaneSize.SMALL)} name={columnSizeId} />
						</label>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Medium</span>
							<Radio ref={paneSizeModel(PaneSize.MEDIUM)} name={columnSizeId} />
						</label>
						<label class={ListBoxItemReadonly}>
							<span class="grow font-medium">Large</span>
							<Radio ref={paneSizeModel(PaneSize.LARGE)} name={columnSizeId} />
						</label>
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Appearance</p>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<div class="grow">
								<p class="grow font-medium">Show profile media in grid form</p>
								<p class="text-de text-muted-fg">This will not affect feeds/lists panes</p>
							</div>
							<Checkbox
								ref={modelChecked(
									() => ui.profileMediaGrid,
									(next) => (ui.profileMediaGrid = next),
								)}
							/>
						</label>

						<label class={ListBoxItemReadonly}>
							<div class="grow">
								<p class="font-medium">Show thread replies in threaded form</p>
								<p class="text-de text-muted-fg">This is an experimental feature</p>
							</div>

							<Checkbox
								ref={modelChecked(
									() => ui.threadedReplies,
									(next) => (ui.threadedReplies = next),
								)}
							/>
						</label>
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Accessibility</p>

					<div class={ListBox}>
						<label class={ListBoxItemReadonly}>
							<div class="grow">
								<p class="font-medium">Remind me to add image descriptions</p>
								<p class="text-de text-muted-fg">
									Enable reminder to add description to images before a post can be sent
								</p>
							</div>
							<Checkbox
								ref={modelChecked(
									() => a11y.warnNoMediaAlt,
									(next) => (a11y.warnNoMediaAlt = next),
								)}
							/>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AppearanceView;
