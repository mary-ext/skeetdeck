import { ListBoxItemInteractive, ListBoxItemReadonly } from '~/com/primitives/list-box';

import Checkbox from '~/com/components/inputs/Checkbox';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';

import SelectAction, { type SelectActionProps } from '../../flyouts/SelectAction';

export type { SelectOption } from '../../flyouts/SelectAction';

export interface DropdownItemProps<T> extends Omit<SelectActionProps<T>, 'children'> {
	title: string;
	description?: string;
}

export const SelectionItem = <T,>(props: DropdownItemProps<T>) => {
	return (
		<SelectAction value={props.value} options={props.options} onChange={props.onChange}>
			<button type="button" class={ListBoxItemInteractive}>
				<div class="flex min-w-0 grow flex-col text-sm">
					<div class="flex justify-between gap-3">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">{props.title}</span>

						<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
							<span class="text-de">
								{(() => {
									const val = props.value;
									const item = props.options.find((x) => x.value === val);

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
	onChange: (next: boolean) => void;
}

export const CheckItem = (props: CheckItemProps) => {
	const onChange = props.onChange;

	return (
		<label class={ListBoxItemReadonly}>
			<div class="grow">
				<p class="grow font-medium">{props.title}</p>
				<p class="text-de text-muted-fg">{props.description}</p>
			</div>

			<div class="ml-1 grid place-items-center">
				<Checkbox checked={props.value} onInput={(ev) => onChange(ev.target.checked)} />
			</div>
		</label>
	);
};
