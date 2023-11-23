import { registerAction, moveAction } from '@use-gesture/core/actions';
import { type UserMoveConfig, type Handler, type EventTypes } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Move hook.
 *
 * @param {Handler<'move'>} handler - the function fired every time the move gesture updates
 * @param {UserMoveConfig} config - the config object including generic options and move options
 */
export const createMove = <EventType = EventTypes['move'], Config extends UserMoveConfig = UserMoveConfig>(
	handler: Handler<'move', EventType>,
	config?: Config,
) => {
	registerAction(moveAction);
	return createRecognizers({ move: handler }, config || {}, 'move');
};
