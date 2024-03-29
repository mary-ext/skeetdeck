import { createEffect } from 'solid-js';

import { type Transformer, useDragDropContext } from '@thisbeyond/solid-dnd';

export interface ConstrainDragAxisProps {
	enabled: boolean;
}

export const ConstrainXDragAxis = (props: ConstrainDragAxisProps) => {
	const [, { onDragStart, onDragEnd, addTransformer, removeTransformer }] = useDragDropContext()!;

	const transformer: Transformer = {
		id: 'constrain-x-axis',
		order: 100,
		callback: (transform) => ({ ...transform, x: 0 }),
	};

	createEffect(() => {
		if (!props.enabled) {
			return;
		}

		onDragStart(({ draggable }) => {
			addTransformer('draggables', draggable.id, transformer);
		});

		onDragEnd(({ draggable }) => {
			removeTransformer('draggables', draggable.id, transformer.id);
		});
	});

	return null;
};

export const ConstrainYDragAxis = (props: ConstrainDragAxisProps) => {
	const [, { onDragStart, onDragEnd, addTransformer, removeTransformer }] = useDragDropContext()!;

	const transformer: Transformer = {
		id: 'constrain-y-axis',
		order: 100,
		callback: (transform) => ({ ...transform, y: 0 }),
	};

	createEffect(() => {
		if (!props.enabled) {
			return;
		}

		onDragStart(({ draggable }) => {
			addTransformer('draggables', draggable.id, transformer);
		});

		onDragEnd(({ draggable }) => {
			removeTransformer('draggables', draggable.id, transformer.id);
		});
	});

	return null;
};
