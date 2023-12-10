import { type JSX, createSignal, untrack } from 'solid-js';

import { type Middleware, autoUpdate, flip, shift, size } from '@floating-ui/dom';
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

export const offsetlessMiddlewares = [
	shift({
		padding: 16,
	}),
	flip({
		padding: 16,
	}),
	size({
		padding: 16,
		apply({ availableWidth, availableHeight, elements }) {
			Object.assign(elements.floating.style, {
				maxWidth: `${availableWidth}px`,
				maxHeight: `${availableHeight}px`,
			});
		},
	}),
];

const defaultMiddlewares: Middleware[] = [offset, ...offsetlessMiddlewares];

export const Flyout = (props: FlyoutProps) => {
	const [isOpen, setIsOpen] = createSignal(false);

	const anchor = props.button;
	assert(anchor instanceof HTMLElement);

	anchor.addEventListener('click', () => {
		setIsOpen(true);
	});

	const modal = (
		<Modal
			open={isOpen()}
			onClose={() => setIsOpen(false)}
			children={(() => {
				const [floating, setFloating] = createSignal<HTMLElement>();

				const position = useFloating(() => anchor, floating, {
					placement: props.placement ?? 'bottom-end',
					strategy: 'absolute',
					middleware: props.middleware ?? defaultMiddlewares,
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

				return untrack(() => props.children(context)) as unknown as JSX.Element;
			})()}
		/>
	);

	return [anchor, modal] as unknown as JSX.Element;
};
