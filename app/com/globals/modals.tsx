import { For, createContext, createSignal, useContext } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import { type Signal, signal } from '~/utils/signals.ts';

import Modal from '../components/Modal.tsx';

type ModalComponent = () => JSX.Element;

export interface ModalOptions {
	disableBackdropClose?: boolean;
}

interface ModalState {
	id: number;
	render: ModalComponent;
	disableBackdropClose: Signal<boolean>;
}

interface ModalContextState {
	id: number;
	close: () => void;
	disableBackdropClose: Signal<boolean>;
}

const [modals, setModals] = createSignal<ModalState[]>([]);
let _id = 0;

const StateContext = createContext<ModalContextState>();

const createModalState = (fn: ModalComponent, options?: ModalOptions): ModalState => {
	return {
		id: _id++,
		render: fn,
		disableBackdropClose: signal(options?.disableBackdropClose ?? false),
	};
};

export const openModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => {
		return $modals.concat(createModalState(fn, options));
	});
};

export const replaceModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => {
		const cloned = $modals.slice(0, -1);
		cloned.push(createModalState(fn, options));

		return cloned;
	});
};

export const closeModal = () => {
	setModals(($modals) => $modals.slice(0, -1));
};

export const closeModalId = (id: number) => {
	setModals(($modals) => $modals.filter((modal) => modal.id !== id));
};

export const resetModals = () => {
	setModals([]);
};

export const useModalState = () => {
	return useContext(StateContext)!;
};

export interface ModalProviderProps {
	desktop?: boolean;
}

export const ModalProvider = (props: ModalProviderProps) => {
	return (
		<For each={modals()}>
			{(modal) => {
				const context: ModalContextState = {
					id: modal.id,
					close: () => closeModalId(modal.id),
					disableBackdropClose: modal.disableBackdropClose,
				};

				return (
					<Modal
						open
						desktop={props.desktop}
						onClose={() => modal.disableBackdropClose.value || closeModal()}
					>
						<StateContext.Provider value={context}>{modal.render()}</StateContext.Provider>
					</Modal>
				);
			}}
		</For>
	);
};
