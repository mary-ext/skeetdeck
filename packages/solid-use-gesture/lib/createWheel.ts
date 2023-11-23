import { registerAction, wheelAction } from '@use-gesture/core/actions';
import { type UserWheelConfig, type Handler, type EventTypes } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Wheel hook.
 *
 * @param {Handler<'wheel'>} handler - the function fired every time the wheel gesture updates
 * @param {UserWheelConfig} config - the config object including generic options and wheel options
 */
export const createWheel = <
	EventType = EventTypes['wheel'],
	Config extends UserWheelConfig = UserWheelConfig,
>(
	handler: Handler<'wheel', EventType>,
	config?: Config,
) => {
	registerAction(wheelAction);
	return createRecognizers({ wheel: handler }, config || {}, 'wheel');
};
