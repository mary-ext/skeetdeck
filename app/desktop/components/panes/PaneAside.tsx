import type { JSX } from 'solid-js';

import { Button } from '~/com/primitives/button.ts';

export interface PaneAsideProps {
	children?: JSX.Element;
	onClose?: () => void;
}

const PaneAside = (props: PaneAsideProps) => {
	return (
		<div class="box-content flex w-72 shrink-0 flex-col border-l border-divider bg-background">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<div class="grow"></div>

				<button
					onClick={props.onClose}
					class={/* @once */ Button({ variant: 'primary', size: 'xs', class: '-mr-2' })}
				>
					Done
				</button>
			</div>

			{props.children}
		</div>
	);
};

export default PaneAside;
