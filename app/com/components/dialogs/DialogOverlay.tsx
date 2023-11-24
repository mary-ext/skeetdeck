import type { JSX } from 'solid-js';

export interface DialogOverlayProps {
	children: JSX.Element;
}

const isDesktop = import.meta.env.VITE_APP_MODE === 'desktop';

const DialogOverlay = (props: DialogOverlayProps) => {
	return (
		<div
			class={
				`overlay-y-auto pointer-events-none flex h-full w-full justify-center overflow-y-auto bg-black/50 dark:bg-muted/50` +
				(isDesktop ? ` items-center p-6` : ` items-end sm:items-center sm:p-6`)
			}
		>
			<div class="pointer-events-auto contents">{props.children}</div>
		</div>
	);
};

export default DialogOverlay;
