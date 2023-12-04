import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down.tsx';

export interface SelectItem {
	value: string;
	label: string;
}

export interface SelectInputProps<T extends SelectItem> {
	value: string;
	options: T[];
	onChange?: (next: T) => void;
}

const SelectInput = <T extends SelectItem>(props: SelectInputProps<T>) => {
	const onChange = props.onChange;

	return (
		<div class="relative h-max grow">
			<select
				value={props.value}
				onChange={
					onChange &&
					((ev) => {
						const target = ev.target;
						const selected = target.selectedOptions[0];

						const item = (selected as any).$item as T | undefined;

						if (!item) {
							return;
						}

						onChange(item);
					})
				}
				class="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-primary outline-2 -outline-offset-1 outline-accent outline-none focus:outline disabled:opacity-50"
			>
				{props.options.map((item) => (
					<option
						// @ts-expect-error
						prop:$item={item}
						value={item.value}
					>
						{item.label}
					</option>
				))}
			</select>

			<div class="pointer-events-none absolute inset-y-0 right-0 mr-px grid place-items-center px-2">
				<ArrowDropDownIcon class="text-lg" />
			</div>
		</div>
	);
};

export default SelectInput;
