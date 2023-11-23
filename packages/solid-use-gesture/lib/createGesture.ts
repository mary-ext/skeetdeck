import {
	dragAction,
	pinchAction,
	scrollAction,
	wheelAction,
	moveAction,
	hoverAction,
} from '@use-gesture/core/actions';
import {
	type GestureHandlers,
	type UserGestureConfig,
	type EventTypes,
	type AnyHandlerEventTypes,
} from '@use-gesture/core/types';

import { createGestureMixin } from './createGestureMixin.ts';

let _hook: ReturnType<typeof createGestureMixin>;

/**
 * @public
 *
 * The most complete gesture hook, allowing support for multiple gestures.
 *
 * @param {GestureHandlers} handlers - an object with on[Gesture] keys containg gesture handlers
 * @param {UseGestureConfig} config - the full config object
 */
export const createGesture = <
	HandlerTypes extends AnyHandlerEventTypes = EventTypes,
	Config extends UserGestureConfig = UserGestureConfig,
>(
	handlers: GestureHandlers<HandlerTypes>,
	config?: Config,
) => {
	_hook ||= createGestureMixin([dragAction, pinchAction, scrollAction, wheelAction, moveAction, hoverAction]);
	return _hook(handlers, config || ({} as Config));
};
