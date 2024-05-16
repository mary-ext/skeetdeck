import { createEffect } from 'solid-js';

import {
	FILTER_FOLLOWS,
	FILTER_LIKES,
	FILTER_MENTIONS,
	FILTER_QUOTES,
	FILTER_REPLIES,
	FILTER_REPOSTS,
} from '~/api/queries/get-notifications';

import { getUniqueId } from '~/utils/misc';

import Checkbox from '~/com/components/inputs/Checkbox';

import type { NotificationsPaneConfig } from '~/desktop/globals/panes';

import { usePaneContext } from '../PaneContext';

const NotificationsPaneSettings = () => {
	const { pane } = usePaneContext<NotificationsPaneConfig>();

	const id = getUniqueId();

	const model = (flag: number) => {
		return (node: HTMLInputElement) => {
			createEffect(() => {
				node.checked = (pane.mask & flag) === 0;
			});

			node.addEventListener('input', () => {
				if (node.checked) {
					pane.mask &= ~flag;
				} else {
					pane.mask |= flag;
				}
			});
		};
	};

	return (
		<div class="flex flex-col border-b border-divider pb-5">
			<p class="p-4 text-sm font-bold">Filter</p>

			<div class="mx-4 flex flex-col gap-2 text-sm">
				<label class="flex items-center justify-between gap-2">
					<span>Mentions</span>
					<Checkbox ref={model(FILTER_MENTIONS)} name={id} />
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Replies</span>
					<Checkbox ref={model(FILTER_REPLIES)} name={id} />
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Quotes</span>
					<Checkbox ref={model(FILTER_QUOTES)} name={id} />
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Likes</span>
					<Checkbox ref={model(FILTER_LIKES)} name={id} />
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Reposts</span>
					<Checkbox ref={model(FILTER_REPOSTS)} name={id} />
				</label>

				<label class="flex items-center justify-between gap-2">
					<span>Follows</span>
					<Checkbox ref={model(FILTER_FOLLOWS)} name={id} />
				</label>
			</div>
		</div>
	);
};

export default NotificationsPaneSettings;
