import { Button } from '../../primitives/button.ts';

export interface GenericErrorViewProps {
	error: unknown;
	onRetry: () => void;
}

const GenericErrorView = (props: GenericErrorViewProps) => {
	return (
		<div class="p-4">
			<div class="mb-4 text-sm">
				<p class="font-bold">Something went wrong</p>
				<p class="text-muted-fg">{'' + props.error}</p>
			</div>

			<button onClick={props.onRetry} class={/* @once */ Button({ variant: 'primary' })}>
				Try again
			</button>
		</div>
	);
};

export default GenericErrorView;
