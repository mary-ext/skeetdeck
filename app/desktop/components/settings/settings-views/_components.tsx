import { createMemo } from 'solid-js';

import { ListBoxItem, ListBoxItemInteractive, ListBoxItemReadonly } from '~/com/primitives/list-box';

import Checkbox from '~/com/components/inputs/Checkbox';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';

import SelectAction, { type SelectActionProps } from '../../flyouts/SelectAction';

export type { SelectOption } from '../../flyouts/SelectAction';

export interface DropdownItemProps<T> extends Omit<SelectActionProps<T>, 'children'> {
	title: string;
	description?: string;
	disabled?: boolean;
}

export const SelectionItem = <T,>(props: DropdownItemProps<T>) => {
	const matched = createMemo(() => {
		const val = props.value;
		const item = props.options.find((x) => x.value === val);

		return item;
	});

	return (
		<SelectAction value={props.value} options={props.options} onChange={props.onChange}>
			<button type="button" disabled={props.disabled} class={ListBoxItemInteractive}>
				<div class="flex min-w-0 grow flex-col text-sm">
					<div class="flex justify-between gap-3">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">{props.title}</span>

						<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
							<span class="text-de">
								{(() => {
									const item = matched();

									if (item) {
										return item.short || item.label;
									}

									return 'N/A';
								})()}
							</span>
							<ArrowDropDownIcon class="-mr-1 text-base" />
						</span>
					</div>
					<p class="mt-1 overflow-hidden text-ellipsis whitespace-pre-wrap text-de text-muted-fg empty:hidden">
						{props.description}
					</p>
				</div>
			</button>
		</SelectAction>
	);
};

export interface CheckItemProps {
	title: string;
	description?: string;
	value?: boolean;
	disabled?: boolean;
	onChange: (next: boolean) => void;
}

export const CheckItem = (props: CheckItemProps) => {
	const onChange = props.onChange;

	return (
		<label class={!props.disabled ? ListBoxItemReadonly : ListBoxItem}>
			<div class="grow">
				<p class="grow font-medium">{props.title}</p>
				<p class="text-de text-muted-fg">{props.description}</p>
			</div>

			<div class="ml-1 grid place-items-center">
				<Checkbox
					disabled={props.disabled}
					checked={props.value}
					onInput={(ev) => onChange(ev.target.checked)}
				/>
			</div>
		</label>
	);
};
