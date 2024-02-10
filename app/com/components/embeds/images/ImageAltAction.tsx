import type { JSX } from 'solid-js';

import { Button } from '../../../primitives/button';

import { Flyout, offsetlessMiddlewares } from '../../Flyout';

export interface ImageAltActionProps {
	alt: string;
	children: JSX.Element;
}

const ImageAltAction = (props: ImageAltActionProps) => {
	if (import.meta.env.VITE_MODE === 'desktop') {
		return (
			<Flyout button={props.children} placement="bottom" middleware={offsetlessMiddlewares}>
				{({ close, menuProps }) => (
					<div
						{...menuProps}
						class="flex flex-col gap-4 overflow-hidden overflow-y-auto rounded-lg bg-background p-4 shadow-menu"
					>
						<h1 class="text-lg font-bold">Image description</h1>

						<p class="max-w-sm whitespace-pre-wrap break-words text-sm">{props.alt}</p>

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
