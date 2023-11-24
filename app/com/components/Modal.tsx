import { type ComponentProps, Show, onCleanup, onMount } from 'solid-js';

export interface ModalProps extends Pick<ComponentProps<'svg'>, 'children'> {
	open?: boolean;
	onClose?: () => void;
}

let checked = false;

const Modal = (props: ModalProps) => {
	let focused: Element | null | undefined;

	return (
		<Show when={props.open}>
			<dialog
				ref={(node) => {
					onMount(() => {
						// handle accidental opening of modals when the parent container has a
						// display: none set on it, this shall be dev only.
						if (import.meta.env.DEV) {
							const style = getComputedStyle(node.parentElement!);

							if (style.display === 'none') {
								console.error('A dialog is being opened while its parent container is hidden');
								return;
							}
						}

						const body = document.body;

						if (
							!checked &&
							(body.scrollHeight > body.clientHeight || getComputedStyle(body).overflowY === 'scroll')
						) {
							const scrollbarSize = getScrollbarSize(document);

							checked = true;
							document.documentElement.style.setProperty('--sb-width', `${scrollbarSize}px`);
						}

						focused = document.activeElement;
						node.returnValue = '';
						node.showModal();
					});

					onCleanup(() => {
						setTimeout(() => {
							if (focused && document.contains(focused)) {
								(focused as any).focus();
								focused = null;
							}
						}, 0);
					});
				}}
				onClick={(ev) => {
					const onClose = props.onClose;

					if (onClose && ev.target === ev.currentTarget) {
						onClose();
					}
				}}
				onCancel={(ev) => {
					const onClose = props.onClose;

					ev.preventDefault();

					if (onClose) {
						onClose();
					}
				}}
				class="m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent backdrop:bg-transparent"
				data-modal
			>
				{props.children}
			</dialog>
		</Show>
	);
};

export default Modal;

export const getScrollbarSize = (document: Document) => {
	const documentWidth = document.documentElement.clientWidth;
	return Math.abs(window.innerWidth - documentWidth);
};
