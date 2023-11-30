import type { JSX } from 'solid-js';

import { flip, shift, size } from '@floating-ui/dom';

import { Button } from '../../../primitives/button.ts';

import { Flyout } from '../../Flyout.tsx';

export interface ImageAltActionProps {
	alt: string;
	children: JSX.Element;
}

const ImageAltAction = (props: ImageAltActionProps) => {
	if (import.meta.env.VITE_APP_MODE === 'desktop') {
		return (
			<Flyout
				button={props.children}
				placement="bottom"
				middleware={[
					flip(),
					shift({ padding: 16 }),
					size({
						padding: 16,
						apply({ availableHeight, elements }) {
							Object.assign(elements.floating.style, {
								maxHeight: `${availableHeight}px`,
							});
						},
					}),
				]}
			>
				{({ close, menuProps }) => (
					<div
						{...menuProps}
						class="flex max-w-sm flex-col gap-4 overflow-hidden overflow-y-auto rounded-lg bg-background p-4 shadow-menu"
					>
						<h1 class="text-lg font-bold">Image description</h1>

						<p class="whitespace-pre-wrap break-words text-sm">{props.alt}</p>

						<div class="flex justify-end">
							<button onClick={close} class={/* @once */ Button({ variant: 'outline' })}>
								Dismiss
							</button>
						</div>
					</div>
				)}
			</Flyout>
		);
	}

	return props.children;
};

export default ImageAltAction;
