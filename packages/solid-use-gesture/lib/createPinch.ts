import { registerAction, pinchAction } from '@use-gesture/core/actions';
import { type UserPinchConfig, type Handler, type EventTypes } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Pinch hook.
 *
 * @param {Handler<'pinch'>} handler - the function fired every time the pinch gesture updates
 * @param {UserPinchConfig} config - the config object including generic options and pinch options
 */
export const createPinch = <
	EventType = EventTypes['pinch'],
	Config extends UserPinchConfig = UserPinchConfig,
>(
	handler: Handler<'pinch', EventType>,
	config?: Config,
) => {
	registerAction(pinchAction);
	return createRecognizers({ pinch: handler }, config || {}, 'pinch');
};
