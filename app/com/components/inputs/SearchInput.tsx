import type { ComponentProps } from 'solid-js';

import { Input } from '~/com/primitives/input.ts';

import SearchIcon from '~/com/icons/baseline-search.tsx';

export type SearchInputProps = ComponentProps<'input'>;

const SearchInput = (props: SearchInputProps) => {
	return (
		<div class="relative grow">
			<div class="pointer-events-none absolute inset-y-0 ml-px grid place-items-center px-2">
				<SearchIcon class="text-lg text-muted-fg" />
			</div>
			<input class={/* @once */ Input({ class: 'pl-8' })} placeholder="Search..." {...props} />
		</div>
	);
};

export default SearchInput;
