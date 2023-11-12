import { type JSX } from 'solid-js';

export interface PaneProps {
	children?: JSX.Element;
}

const Pane = (props: PaneProps) => {
	return <div class="flex w-96 shrink-0 flex-col bg-background">{props.children}</div>;
};

export default Pane;
