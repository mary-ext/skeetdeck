import { untrack } from 'solid-js';

import { getUniqueId } from '~/utils/misc';

import CheckIcon from '~/com/icons/baseline-check';

export interface FilterItem<T> {
	value: T;
	label: string;
}

export interface FilterBarProps<T> {
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
		<div class="flex min-w-0 flex-wrap gap-2">
			{props.items.map((item) => {
				const isSelected = () => props.value === item.value;
				return (
					<label class="flex cursor-pointer">
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

						<span
							class={`flex min-w-0 items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm font-medium outline-2 -outline-offset-2 outline-primary disabled:pointer-events-none peer-focus-visible:outline ${
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
						</span>
					</label>
				);
			})}
		</div>
	);
};

export default FilterBar;
