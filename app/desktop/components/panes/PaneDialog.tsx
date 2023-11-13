import type { JSX } from 'solid-js';

export interface PaneDialogProps {
	children?: JSX.Element;
}

const PaneDialog = (props: PaneDialogProps) => {
	return <div class="flex h-full flex-col bg-background">{props.children}</div>;
};

export default PaneDialog;
