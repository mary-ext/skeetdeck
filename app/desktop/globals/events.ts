import { EventEmitter } from '@mary/events';

import { type BasePaneConfig, getPaneSizeWidth } from './panes';
import { resolvePaneSize } from './settings';

export const desktopEvents = new EventEmitter<{
	[k: `focuspane:${string}`]: () => void;
}>();

export const onFocusPane = (pane: BasePaneConfig, node: HTMLElement) => {
	return desktopEvents.on(`focuspane:${pane.id}`, () => {
		{
			const overlay = document.createElement('div');

			overlay.className = `absolute top-0 z-30 outline-4 outline-transparent outline`;
			overlay.style.left = node.scrollLeft + 'px';
			overlay.style.height = `100vh`;
			overlay.style.width = getPaneSizeWidth(resolvePaneSize(pane.size)) + 'px';

			node.parentElement!.after(overlay);

			const animation = overlay.animate(
				[
					{ outlineColor: 'rgb(var(--accent))' },
					{ outlineColor: 'rgb(var(--accent))', offset: 0.3 },
					{ outlineColor: 'transparent' },
				],
				{
					duration: 350,
				},
			);

			node.scrollIntoView({ behavior: 'instant', inline: 'center' });
			animation.onfinish = () => overlay.remove();
		}
	});
};
