import { parseMergedHandlers } from '@use-gesture/core';
import { registerAction } from '@use-gesture/core/actions';
import { type Action, type GestureHandlers, type UserGestureConfig } from '@use-gesture/core/types';

import { createRecognizers } from './createRecognizers.ts';

export const createGestureMixin = (actions: Action[]) => {
	actions.forEach((action) => registerAction(action));

	const useGesture = <Config extends UserGestureConfig = UserGestureConfig>(
		_handlers: GestureHandlers,
		_config?: Config,
	) => {
		const { handlers, nativeHandlers, config } = parseMergedHandlers(_handlers, _config || {});
		return createRecognizers<Config>(handlers, config, undefined, nativeHandlers);
	};

	return useGesture;
};
