import { formatQueryError } from '~/api/utils/misc';
import { Button } from '../../primitives/button';

export interface GenericErrorViewProps {
	padded?: boolean;
	error: unknown;
	onRetry?: () => void;
}

const GenericErrorView = (props: GenericErrorViewProps) => {
	return (
		<div class={!props.padded ? `p-4` : `px-4 py-6`}>
			<div class="mb-4 text-sm">
				<p class="font-bold">Something went wrong</p>
				<p class="text-muted-fg">{formatQueryError(props.error)}</p>
			</div>

			<button onClick={props.onRetry} class={/* @once */ Button({ variant: 'primary' })}>
				Try again
			</button>
		</div>
	);
};

export default GenericErrorView;
