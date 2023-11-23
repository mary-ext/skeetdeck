import { type JSX } from 'solid-js';

import { type DOMHandlers } from '@use-gesture/core/types';

type CombinedDOMHandlers = JSX.DOMAttributes<EventTarget> & DOMHandlers;

export type SolidDOMAttributes = {
	[Key in keyof DOMHandlers]: CombinedDOMHandlers[Key];
};
