import { untrack } from 'solid-js';

import { getUniqueId } from '~/utils/misc';

import CheckIcon from '../../icons/baseline-check';

export interface FilterItem<T> {
	value: T;
	label: string;
}

export interface FilterBarProps<T> {
	disabled?: boolean;
	value: T;
	items: FilterItem<T>[];
	onChange: (next: T) => void;
}

const FilterBar = <T,>(props: FilterBarProps<T>) => {
	const inputId = getUniqueId();

	const handleChange = (ev: Event) => {
		const target = ev.target as HTMLInputElement;

		if (target.checked) {
			const item = (target as any).$item as FilterItem<T>;
			props.onChange(item.value);
		}
	};

	return (
		<fieldset disabled={props.disabled} class="flex min-w-0 flex-wrap gap-2">
			{props.items.map((item) => {
				const isSelected = () => props.value === item.value;
				return (
					<label class="flex">
						<input
							type="radio"
							name={inputId}
							checked={(() => {
								// We really only need it once
								return untrack(isSelected);
							})()}
							onChange={handleChange}
							class="peer h-0 w-0 appearance-none leading-none outline-none"
							// @ts-expect-error
							prop:$item={item}
						/>

						<fieldset
							class={`flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-left text-sm font-medium outline-2 -outline-offset-2 outline-primary disabled:pointer-events-none disabled:opacity-50 peer-focus-visible:outline ${
								!isSelected()
									? `border-input hover:bg-secondary/30`
									: `border-transparent bg-accent-dark text-white hover:bg-accent-dark/80`
							}`}
						>
							{(() => {
								if (isSelected()) {
									return <CheckIcon class="-ml-0.5 text-base" />;
								}
							})()}

							{item.label}
						</fieldset>
					</label>
				);
			})}
		</fieldset>
	);
};

export default FilterBar;
