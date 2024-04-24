import { modelChecked } from '~/utils/input';

import { PaneSize } from '~/desktop/globals/panes';
import { preferences } from '~/desktop/globals/settings';

import { ListBox, ListBoxItemReadonly, ListGroup, ListGroupHeader } from '~/com/primitives/list-box';

import Checkbox from '~/com/components/inputs/Checkbox';

import { SelectionItem } from './_components';

const AppearanceView = () => {
	const ui = preferences.ui;
	const a11y = preferences.a11y;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Interface</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<p class={ListGroupHeader}>Appearance</p>

					<div class={ListBox}>
						<SelectionItem<typeof ui.theme>
							title="Application theme"
							value={ui.theme}
							onChange={(next) => (ui.theme = next)}
							options={[
								{
									value: 'auto',
									label: `System default`,
								},
								{
									value: 'light',
									label: `Light`,
								},
								{
									value: 'dark',
									label: `dark`,
								},
							]}
						/>

						<SelectionItem<typeof ui.defaultPaneSize>
							title="Default column size"
							value={ui.defaultPaneSize}
							onChange={(next) => (ui.defaultPaneSize = next)}
							options={[
								{
									value: PaneSize.SMALL,
									label: `Small`,
								},
								{
									value: PaneSize.MEDIUM,
									label: `Medium`,
								},
								{
									value: PaneSize.LARGE,
									label: `Large`,
								},
							]}
						/>
					</div>

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
								<p class="font-medium">Show post replies in threaded form</p>
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
