import { type Accessor, type JSX, For, Suspense, createSignal } from 'solid-js';

import { signal } from '~/utils/signals';

import CircularProgress from '~/com/components/CircularProgress';

import type { BasePaneConfig } from '../../globals/panes';

import { PaneLinkingProvider } from './PaneLinkingProvider';

import {
	type PaneContextObject,
	type PaneModalContextObject,
	type PaneModalState,
	PaneContext,
	PaneModalContext,
} from './PaneContext';

export interface PaneContextProviderProps {
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

	const { pane, index } = props;

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

	const paneContext: PaneContextObject = {
		pane: pane,
		index: index,
		deletePane: props.onDelete,
		openModal: openModal,
	};

	return (
		<PaneContext.Provider value={paneContext}>
			<PaneLinkingProvider>
				<div class="relative">
					<div class="flex h-full" inert={modals().length > 0}>
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
									inert={modals().length - 1 !== index()}
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
