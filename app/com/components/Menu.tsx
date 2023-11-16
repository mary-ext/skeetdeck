import { type JSX, createSignal } from 'solid-js';

import { type Middleware, autoUpdate, flip } from '@floating-ui/dom';
import { type Placement, getSide } from '@floating-ui/utils';
import { useFloating } from 'solid-floating-ui';

import { assert } from '~/utils/misc.ts';

import Modal from './Modal.tsx';

export interface MenuContext {
	close: () => void;
}

export interface MenuProps {
	/** Expected to be static */
	placement?: Placement;
	/** Expected to be static */
	middleware?: Middleware[];
	button: JSX.Element;
	children: (context: MenuContext) => JSX.Element;
}

const offset: Middleware = {
	name: 'offset',
	fn(state) {
		const reference = state.rects.reference;
		const x = state.x;
		const y = state.y;

		const multi = getSide(state.placement) === 'bottom' ? 1 : -1;

		return {
			x: x,
			y: y - reference.height * multi,
		};
	},
};

export const Menu = (props: MenuProps) => {
	const [isOpen, setIsOpen] = createSignal(false);

	let anchor: HTMLElement;

	const render = () => {
		const $button = props.button;
		assert($button instanceof HTMLElement);

		anchor = $button;

		$button.addEventListener('click', () => {
			setIsOpen(true);
		});

		return $button;
	};

	let modal: JSX.Element;

	if (import.meta.env.VITE_APP_MODE === 'desktop') {
		modal = (
			<Modal open={isOpen()} onClose={() => setIsOpen(false)} disableOverlay desktop>
				{(() => {
					const [floating, setFloating] = createSignal<HTMLElement>();

					const position = useFloating(() => anchor, floating, {
						placement: props.placement ?? 'bottom-end',
						strategy: 'absolute',
						middleware: props.middleware ?? [flip(), offset],
						whileElementsMounted: autoUpdate,
					});

					const context: MenuContext = {
						close: () => setIsOpen(false),
					};

					return (
						<div
							ref={setFloating}
							class="shadow-menu w-72 rounded-lg bg-background"
							style={{
								position: position.strategy,
								top: `${position.y ?? 0}px`,
								left: `${position.x ?? 0}px`,
							}}
						>
							{props.children(context)}
						</div>
					);
				})()}
			</Modal>
		);
	} else {
		// @todo: implement mobile scenario
	}

	return [render, modal] as unknown as JSX.Element;
};
