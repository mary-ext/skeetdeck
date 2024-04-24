import { ListBoxItemInteractive } from '~/com/primitives/list-box';

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
			<button class={ListBoxItemInteractive}>
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
