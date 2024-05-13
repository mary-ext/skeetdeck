import { For, Suspense, createSignal, type Accessor, type JSX } from 'solid-js';

import { createSortable, transformStyle } from '@thisbeyond/solid-dnd';

import { clsx } from '~/utils/misc';
import { signal } from '~/utils/signals';

import CircularProgress from '~/com/components/CircularProgress';

import type { BasePaneConfig, DeckConfig } from '../../globals/panes';

import {
	PaneContext,
	PaneModalContext,
	type PaneContextObject,
	type PaneModalContextObject,
	type PaneModalState,
} from './PaneContext';
import { PaneLinkingProvider } from './PaneLinkingProvider';

export type Sortable = ReturnType<typeof createSortable>;

export interface PaneContextProviderProps {
	/** Expected to be static */
	deck: DeckConfig;
	/** Expected to be static */
	pane: BasePaneConfig;
	/** Expected to be static */
	index: Accessor<number>;
	/** Expected to be static */
	onDelete: () => void;
	children?: JSX.Element;
}

export const PaneContextProvider = (props: PaneContextProviderProps) => {
	let _id = 0;

	const { deck, pane, index } = props;

	const [modals, setModals] = createSignal<PaneModalState[]>([]);

	const openModal: PaneContextObject['openModal'] = (fn, _options) => {
		const next = modals().concat({
			id: _id++,
			render: fn,
			disableBackdropClose: signal(false),
		});

		setModals(next);
	};

	const resetModals = () => {
		setModals([]);
	};

	const sortable = createSortable(pane.id);

	const paneContext: PaneContextObject = {
		deck: deck,
		pane: pane,
		index: index,
		sortable: sortable,
		deletePane: props.onDelete,
		openModal: openModal,
	};

	return (
		<PaneContext.Provider value={paneContext}>
			<PaneLinkingProvider>
				<div
					ref={sortable.ref}
					class={clsx([
						`relative`,
						sortable.isActiveDraggable && `z-10 cursor-grabbing shadow-lg shadow-black`,
					])}
					style={transformStyle(sortable.transform)}
				>
					<div class="flex h-full" prop:inert={sortable.isActiveDraggable || modals().length > 0}>
						{props.children}
					</div>

					<For each={modals()}>
						{(modal, index) => {
							const context: PaneModalContextObject = {
								id: modal.id,
								get depth() {
									return index();
								},
								disableBackdropClose: modal.disableBackdropClose,
								close: () => {
									setModals(modals().toSpliced(index(), 1));
								},
								reset: resetModals,
							};

							return (
								<div
									onClick={(ev) => {
										if (ev.target === ev.currentTarget && !modal.disableBackdropClose.value) {
											resetModals();
										}
									}}
									class="absolute inset-0 z-10 flex flex-col overflow-hidden bg-black/50 pt-13 dark:bg-hinted/50"
									prop:inert={sortable.isActiveDraggable || modals().length - 1 !== index()}
								>
									<PaneModalContext.Provider value={context}>
										<Suspense
											fallback={
												<div class="pointer-events-none grid grow place-items-center">
													<CircularProgress />
												</div>
											}
										>
											{modal.render()}
										</Suspense>
									</PaneModalContext.Provider>
								</div>
							);
						}}
					</For>
				</div>
			</PaneLinkingProvider>
		</PaneContext.Provider>
	);
};

declare module 'solid-js' {
	namespace JSX {
		interface ExplicitProperties {
			inert?: boolean;
		}
	}
}
