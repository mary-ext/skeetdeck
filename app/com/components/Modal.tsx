import { type ComponentProps, Show, createEffect, onCleanup } from 'solid-js';

export interface ModalProps extends Pick<ComponentProps<'svg'>, 'children'> {
	desktop?: boolean;
	open?: boolean;
	onClose?: () => void;
}

let checked = false;

const Modal = (props: ModalProps) => {
	let dialog: HTMLDialogElement | undefined;
	let focused: Element | null | undefined;

	createEffect(() => {
		const open = props.open;

		if (!dialog) {
			return;
		}

		if (open) {
			if (dialog.open) {
				// we're already open, bail out
				return;
			}

			// handle accidental opening of modals when the parent container has a
			// display: none set on it, this shall be dev only.
			if ((import.meta as any).env.DEV) {
				const style = getComputedStyle(dialog.parentElement!);

				if (style.display === 'none') {
					console.error('A dialog is being opened while its parent container is hidden');
					dialog.close();
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
			dialog.returnValue = '';
			dialog.showModal();
		} else if (dialog.open) {
			dialog.close();

			if (focused && document.contains(focused)) {
				(focused as any).focus();
			}

			focused = null;
		}
	});

	onCleanup(() => {
		if (focused && document.contains(focused)) {
			setTimeout(() => (focused as any).focus(), 0);
		}
	});

	return (
		<dialog
			ref={dialog}
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
			class="m-0 h-full max-h-none w-full max-w-none justify-center overflow-y-auto bg-black/50 modal:flex dark:bg-hinted/50"
			classList={{
				[`items-center p-6`]: props.desktop,
				[`items-end sm:items-center sm:p-6`]: !props.desktop,
			}}
			data-modal
		>
			<Show when={props.open}>{props.children}</Show>
		</dialog>
	);
};

export default Modal;

const getScrollbarSize = (document: Document) => {
	const documentWidth = document.documentElement.clientWidth;
	return Math.abs(window.innerWidth - documentWidth);
};
