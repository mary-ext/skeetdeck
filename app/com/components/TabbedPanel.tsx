import { type JSX, For, Show, children, createMemo } from 'solid-js';

import { Freeze } from '@pkg/solid-freeze';

import Tab from '~/com/components/Tab.tsx';

export interface TabbedPanelViewProps {
	label: string;
	value: number;
	hidden?: boolean;
	children?: JSX.Element;
}

export const TabbedPanelView = (props: TabbedPanelViewProps) => {
	return props as unknown as JSX.Element;
};

export interface TabbedPanelProps {
	selected: number;
	onChange: (next: number) => void;
	children: JSX.Element;
}

export const TabbedPanel = (props: TabbedPanelProps) => {
	const panels = children(() => props.children);

	const selectedArray = createMemo<number[]>((prev) => {
		const $selected = props.selected;

		if (!prev.includes($selected)) {
			return prev.concat($selected);
		}

		return prev;
	}, []);

	const rendered = (): TabbedPanelViewProps[] => {
		const $panels = panels.toArray() as unknown as TabbedPanelViewProps[];
		const $selectedArray = selectedArray();

		const array: TabbedPanelViewProps[] = [];

		for (let idx = 0, len = $panels.length; idx < len; idx++) {
			const panel = $panels[idx];

			if (panel.hidden || !$selectedArray.includes(panel.value)) {
				continue;
			}

			array.push(panel);
		}

		return array;
	};

	return (
		<>
			<div class="box-content flex h-13 shrink-0 overflow-x-auto border-b border-divider">
				<For each={panels.toArray() as unknown as TabbedPanelViewProps[]}>
					{(panel) => (
						<>
							{!panel.hidden && (
								<Tab active={props.selected === panel.value} onClick={() => props.onChange(panel.value)}>
									{panel.label}
								</Tab>
							)}
						</>
					)}
				</For>
			</div>

			<For each={rendered()}>
				{(panel) => <Freeze freeze={props.selected !== panel.value}>{panel.children}</Freeze>}
			</For>
		</>
	);
};
