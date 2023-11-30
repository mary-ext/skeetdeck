import { type JSX, createSignal, onCleanup } from 'solid-js';

import { type Middleware, autoUpdate, flip, shift } from '@floating-ui/dom';
import { type Placement, getSide } from '@floating-ui/utils';
import { useFloating } from 'solid-floating-ui';

import { assert } from '~/utils/misc.ts';

import Modal from './Modal.tsx';

export interface MenuContentProps {
	ref: (el: HTMLElement) => void;
	style: JSX.CSSProperties;
}

export interface MenuContext {
	close: () => void;
	menuProps: MenuContentProps;
}

export interface FlyoutProps {
	/** Expected to be static */
	placement?: Placement;
	/** Expected to be static */
	middleware?: Middleware[];
	button: JSX.Element;
	children: (context: MenuContext) => JSX.Element;
}

export const offset: Middleware = {
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

export const Flyout = (props: FlyoutProps) => {
	const [isOpen, setIsOpen] = createSignal(false);

	let anchor: HTMLElement;

	const render = () => {
		const listener = () => {
			setIsOpen(true);
		};

		const $button = props.button;
		assert($button instanceof HTMLElement);

		anchor = $button;

		$button.addEventListener('click', listener);
		onCleanup(() => $button.removeEventListener('click', listener));

		return $button;
	};

	const modal = (
		<Modal
			open={isOpen()}
			onClose={() => setIsOpen(false)}
			children={(() => {
				const [floating, setFloating] = createSignal<HTMLElement>();

				const position = useFloating(() => anchor, floating, {
					placement: props.placement ?? 'bottom-end',
					strategy: 'absolute',
					middleware: props.middleware ?? [shift({ padding: 16 }), offset, flip()],
					whileElementsMounted: autoUpdate,
				});

				const context: MenuContext = {
					menuProps: {
						ref: setFloating,
						get style() {
							return {
								position: position.strategy,
								top: `${position.y ?? 0}px`,
								left: `${position.x ?? 0}px`,
							};
						},
					},
					close: () => setIsOpen(false),
				};

				return (() => props.children(context)) as unknown as JSX.Element;
			})()}
		/>
	);

	return [render, modal] as unknown as JSX.Element;
};
