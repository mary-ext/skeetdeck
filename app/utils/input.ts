import { type Accessor, createRenderEffect } from 'solid-js';

export const model = (getter: Accessor<string>, setter: (next: string) => void) => {
	return (node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
		createRenderEffect(() => {
			node.value = getter();
		});

		node.addEventListener('input', () => {
			setter(node.value);
		});
	};
};

export const modelChecked = (getter: Accessor<boolean>, setter: (next: boolean) => void) => {
	return (node: HTMLInputElement) => {
		createRenderEffect(() => {
			node.checked = getter();
		});

		node.addEventListener('input', () => {
			setter(node.checked);
		});
	};
};

export const modelRadio = (value: string, getter: Accessor<string>, setter: (next: string) => void) => {
	return (node: HTMLInputElement) => {
		createRenderEffect(() => {
			node.checked = getter() === value;
		});

		node.addEventListener('input', () => {
			setter(value);
		});
	};
};
