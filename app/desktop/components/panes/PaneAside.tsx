import { type JSX, Suspense } from 'solid-js';

import CircularProgress from '~/com/components/CircularProgress';

import { Button } from '~/com/primitives/button';

export interface PaneAsideProps {
	children?: JSX.Element;
	onClose?: () => void;
}

const PaneAside = (props: PaneAsideProps) => {
	return (
		<div class="box-content flex w-72 shrink-0 flex-col border-l border-divider bg-background">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<div class="grow"></div>

				<button onClick={props.onClose} class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
					Done
				</button>
			</div>

			<Suspense
				fallback={
					<div class="grid grow place-items-center">
						<CircularProgress />
					</div>
				}
			>
				<div class="flex min-h-0 grow flex-col overflow-y-auto">{props.children}</div>
			</Suspense>
		</div>
	);
};

export default PaneAside;
