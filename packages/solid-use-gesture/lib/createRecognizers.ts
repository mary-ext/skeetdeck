import { onCleanup, onMount } from 'solid-js';

import { Controller } from '@use-gesture/core';
import {
	type GenericOptions,
	type GestureKey,
	type InternalHandlers,
	type NativeHandlers,
} from '@use-gesture/core/types';

import { type SolidDOMAttributes } from './types.ts';

type HookReturnType<Config extends GenericOptions> = Config['target'] extends object
	? void
	: (...args: any[]) => SolidDOMAttributes;

/**
 * Utility hook called by all gesture hooks and that will be responsible for
 * the internals.
 *
 * @param {InternalHandlers} handlers
 * @param {GenericOptions} config
 * @param {GestureKey} gestureKey
 * @param {NativeHandler} nativeHandlers
 * @returns nothing when config.target is set, a binding function when not.
 */
export const createRecognizers = <Config extends GenericOptions>(
	handlers: InternalHandlers,
	config: Config | {} = {},
	gestureKey?: GestureKey,
	nativeHandlers?: NativeHandlers,
): HookReturnType<Config> => {
	const ctrl = new Controller(handlers);
	ctrl.applyHandlers(handlers, nativeHandlers);
	ctrl.applyConfig(config, gestureKey);

	onMount(() => {
		ctrl.effect();

		onCleanup(ctrl.clean.bind(ctrl));
	});

	// When target is undefined we return the bind function of the controller which
	// returns prop handlers.
	// @ts-ignore
	if (config.target === undefined) {
		// @ts-ignore
		return ctrl.bind.bind(ctrl);
	}

	// @ts-ignore
	return;
};
