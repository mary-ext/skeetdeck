import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';

export interface SelectItem<T extends string = string> {
	value: T;
	label: string;
}

export interface SelectInputProps<T extends string> {
	value: T;
	disabled?: boolean;
	options: (SelectItem<T> | null | undefined | false)[];
	onChange: (next: string) => void;
}

const SelectInput = <T extends string>(props: SelectInputProps<T>) => {
	const onChange = props.onChange;

	return (
		<fieldset disabled={props.disabled} class="relative inline-block h-max disabled:opacity-50">
			<select
				value={props.value}
				onChange={(ev) => {
					const target = ev.target;
					onChange(target.value);
				}}
				class="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-primary outline-2 -outline-offset-1 outline-accent outline-none focus:outline"
			>
				{props.options.map((item) => (item ? <option value={item.value}>{item.label}</option> : null))}
			</select>

			<div class="pointer-events-none absolute inset-y-0 right-0 mr-px grid place-items-center px-2">
				<ArrowDropDownIcon class="text-lg" />
			</div>
		</fieldset>
	);
};

export default SelectInput;
