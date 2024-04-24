import { PaneSize } from '~/desktop/globals/panes';
import { preferences } from '~/desktop/globals/settings';

import { ListBox, ListGroup, ListGroupHeader } from '~/com/primitives/list-box';

import { CheckItem, SelectionItem } from './_components';

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
									label: `Dark`,
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
						<CheckItem
							title="Show profile media in a grid"
							description="This will not affect feeds/lists panes"
							value={ui.profileMediaGrid}
							onChange={(next) => (ui.profileMediaGrid = next)}
						/>

						<CheckItem
							title="Show post replies in threaded form"
							description="This is an experimental feature"
							value={ui.threadedReplies}
							onChange={(next) => (ui.threadedReplies = next)}
						/>
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Accessibility</p>

					<div class={ListBox}>
						<CheckItem
							title="Remind me to add image descriptions"
							description="Enable reminder to add descriptions to images before any post can be sent"
							value={a11y.warnNoMediaAlt}
							onChange={(next) => (a11y.warnNoMediaAlt = next)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AppearanceView;
