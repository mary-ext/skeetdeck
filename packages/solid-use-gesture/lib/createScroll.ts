import { registerAction, scrollAction } from '@use-gesture/core/actions';
import { type UserScrollConfig, type Handler, type EventTypes } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

/**
 * Scroll hook.
 *
 * @param {Handler<'scroll'>} handler - the function fired every time the scroll gesture updates
 * @param {UserScrollConfig} config - the config object including generic options and scroll options
 */
export const createScroll = <
	EventType = EventTypes['scroll'],
	Config extends UserScrollConfig = UserScrollConfig,
>(
	handler: Handler<'scroll', EventType>,
	config?: Config,
) => {
	registerAction(scrollAction);
	return createRecognizers({ scroll: handler }, config || {}, 'scroll');
};
