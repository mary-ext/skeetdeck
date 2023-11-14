import interactive from '~/com/primitives/interactive.ts';

import DeleteIcon from '~/com/icons/baseline-delete.tsx';

import { usePaneContext } from '../PaneContext.tsx';

const DeletePaneSettings = () => {
	const { deletePane } = usePaneContext();

	return (
		<button
			onClick={deletePane}
			class={
				/* @once */ interactive({
					class: 'flex items-center gap-4 border-b border-divider p-4 text-red-500',
				})
			}
		>
			<DeleteIcon class="text-lg" />
			<span class="text-sm">Delete this column</span>
		</button>
	);
};

export default DeletePaneSettings;
