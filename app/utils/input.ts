import { type Accessor, createEffect } from 'solid-js';

export const model = (getter: Accessor<string>, setter: (next: string) => void) => {
	return (node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
		createEffect(() => {
			node.value = getter();
		});

		node.addEventListener('input', () => {
			setter(node.value);
		});
	};
};

export const modelChecked = (getter: Accessor<boolean>, setter: (next: boolean) => void) => {
	return (node: HTMLInputElement) => {
		createEffect(() => {
			node.checked = getter();
		});

		node.addEventListener('input', () => {
			setter(node.checked);
		});
	};
};

export const createRadioModel = <T>(getter: Accessor<T>, setter: (next: T) => void) => {
	return (value: T) => {
		return (node: HTMLInputElement) => {
			createEffect(() => {
				node.checked = getter() === value;
			});

			node.addEventListener('input', () => {
				setter(value);
			});
		};
	};
};

export const createMultipleChoiceModel = <T>(getter: Accessor<T[]>, setter: (next: T[]) => void) => {
	return (value: T) => {
		return (node: HTMLInputElement) => {
			const n = node as typeof node & { _idx: number };

			createEffect(() => {
				n.checked = (n._idx = getter().indexOf(value)) !== -1;
			});

			node.addEventListener('input', () => {
				const index = n._idx;
				const array = getter();

				if (index === -1) {
					setter([...array, value]);
				} else {
					setter(array.toSpliced(index, 1));
				}
			});
		};
	};
};
