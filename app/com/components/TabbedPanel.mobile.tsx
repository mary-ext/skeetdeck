import { type JSX, For, children, createMemo } from 'solid-js';

import { Freeze } from '@pkg/solid-freeze';

import Tab from './Tab';

import type { TabbedPanelProps, TabbedPanelViewProps } from './TabbedPanel';

export const TabbedPanelView = (props: TabbedPanelViewProps) => {
	return props as unknown as JSX.Element;
};

export const TabbedPanel = <T extends string | number>(props: TabbedPanelProps<T>) => {
	let sentinel: HTMLDivElement;

	const panels = children(() => props.children);

	const selectedArray = createMemo<T[]>((prev) => {
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

			if (panel.hidden || !$selectedArray.includes(panel.value as T)) {
				continue;
			}

			array.push(panel);
		}

		return array;
	};

	return (
		<div ref={sentinel!} class="flex min-h-[calc(100vh-3.25rem)] scroll-m-13 flex-col">
			<div class="sticky top-13 z-30 flex h-13 shrink-0 overflow-x-auto border-b border-divider bg-background">
				<For each={panels.toArray() as unknown as TabbedPanelViewProps[]}>
					{(panel) => (
						<>
							{!panel.hidden && (
								<Tab
									active={props.selected === panel.value}
									onClick={() => {
										if (props.selected === panel.value) {
											sentinel.scrollIntoView({ block: 'start', behavior: 'smooth' });
										} else {
											props.onChange(panel.value as T);
										}
									}}
								>
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
		</div>
	);
};
