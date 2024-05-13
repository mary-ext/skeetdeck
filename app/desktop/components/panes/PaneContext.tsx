import { createContext, useContext, type Accessor, type JSX } from 'solid-js';

import { createSortable } from '@thisbeyond/solid-dnd';

import { type Signal } from '~/utils/signals';

import type { BasePaneConfig, DeckConfig } from '../../globals/panes';

export type Sortable = ReturnType<typeof createSortable>;

export type PaneModalComponent = () => JSX.Element;

export interface PaneModalOptions {}

export interface PaneModalState {
	id: number;
	render: PaneModalComponent;
	disableBackdropClose: Signal<boolean>;
}

export interface PaneModalContextObject {
	readonly id: number;
	readonly depth: number;
	disableBackdropClose: Signal<boolean>;
	close: () => void;
	reset: () => void;
}

export const PaneModalContext = createContext<PaneModalContextObject>();

/*#__NO_SIDE_EFFECTS__*/
export const usePaneModalState = () => {
	return useContext(PaneModalContext)!;
};

export interface PaneContextObject<T extends BasePaneConfig = BasePaneConfig> {
	deck: DeckConfig;
	pane: T;
	index: Accessor<number>;
	sortable: Sortable;
	deletePane(): void;
	openModal(fn: PaneModalComponent, options?: PaneModalOptions): void;
}

export const PaneContext = createContext<PaneContextObject>();

/*#__NO_SIDE_EFFECTS__*/
export const usePaneContext = <T extends BasePaneConfig = BasePaneConfig>() => {
	return useContext(PaneContext) as PaneContextObject<T>;
};
