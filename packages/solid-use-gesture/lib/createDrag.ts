import { registerAction, dragAction } from '@use-gesture/core/actions';
import { type EventTypes, type Handler, type UserDragConfig } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Drag hook.
 *
 * @param {Handler<'drag'>} handler - the function fired every time the drag gesture updates
 * @param {UserDragConfig} config - the config object including generic options and drag options
 */
export const createDrag = <EventType = EventTypes['drag'], Config extends UserDragConfig = UserDragConfig>(
	handler: Handler<'drag', EventType>,
	config?: Config,
) => {
	registerAction(dragAction);
	return createRecognizers({ drag: handler }, config || {}, 'drag');
};
