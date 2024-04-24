import { onMount, untrack, type JSX } from 'solid-js';

import { clsx } from '~/utils/misc';

import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import CheckIcon from '~/com/icons/baseline-check';

export interface SelectOption<T> {
	value: T;
	short?: string;
	label: JSX.Element;
}

export interface SelectActionProps<T> {
	value?: T;
	options: SelectOption<T>[];
	onChange: (next: T) => void;
	children: JSX.Element;
}

const SelectAction = <T,>(props: SelectActionProps<T>) => {
	return (
		<Flyout button={props.children} middleware={offsetlessMiddlewares} placement="bottom-end">
			{({ close, menuProps }) => {
				const onChange = props.onChange;

				return (() => {
					let selected: HTMLButtonElement | undefined;

					const options = props.options;
					const initialValue = untrack(() => props.value);

					const handleKeyDown = (ev: KeyboardEvent) => {
						const key = ev.key;

						const isArrowUp = key === 'ArrowUp';
						const isArrowDown = key === 'ArrowDown';

						if (!selected || (!isArrowUp && !isArrowDown)) {
							return;
						}

						const next = isArrowUp ? selected.previousSibling : selected.nextSibling;

						if (!(next instanceof HTMLButtonElement)) {
							return;
						}

						ev.preventDefault();

						next.tabIndex = 0;
						next.focus();
						next.scrollIntoView({ block: 'center' });

						selected.tabIndex = -1;
						selected = next;
					};

					return (
						<div
							ref={(node) => {
								menuProps.ref(node);

								onMount(() => {
									if (selected) {
										selected.focus();

										// blergh
										requestAnimationFrame(() => {
											selected!.scrollIntoView({ block: 'center' });
										});
									} else {
										const first = node.querySelector<HTMLButtonElement>(':scope > button');

										if (first) {
											first.focus();
											selected = first;
										}
									}
								});
							}}
							onKeyDown={handleKeyDown}
							class={/* @once */ MenuRoot()}
							style={menuProps.style}
						>
							{options.map(({ value, label }) => {
								return (
									<button
										ref={(node) => {
											if (value === initialValue) {
												node.tabIndex = 0;
												selected = node;
											} else {
												node.tabIndex = -1;
											}
										}}
										onClick={() => {
											close();
											onChange(value);
										}}
										class={/* @once */ MenuItem()}
									>
										<span class="min-w-0 grow">{label}</span>

										<CheckIcon
											class={clsx([`shrink-0 text-base text-accent`, value !== props.value && `invisible`])}
										/>
									</button>
								);
							})}
						</div>
					);
				}) as unknown as JSX.Element;
			}}
		</Flyout>
	);
};

export default SelectAction;
