import { registerAction, hoverAction } from '@use-gesture/core/actions';
import { type EventTypes, type UserHoverConfig, type Handler } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Hover hook.
 *
 * @param {Handler<'hover'>} handler - the function fired every time the hover gesture updates
 * @param {UserHoverConfig} config - the config object including generic options and hover options
 */
export const createHover = <
	EventType = EventTypes['hover'],
	Config extends UserHoverConfig = UserHoverConfig,
>(
	handler: Handler<'hover', EventType>,
	config?: Config,
) => {
	registerAction(hoverAction);
	return createRecognizers({ hover: handler }, config || {}, 'hover');
};
