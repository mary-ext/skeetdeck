import type { ComponentProps } from 'solid-js';

import SearchIcon from '../../icons/baseline-search';
import { Input } from '../../primitives/input';

export type SearchInputProps = ComponentProps<'input'>;

const SearchInput = (props: SearchInputProps) => {
	return (
		<div class="relative h-max grow">
			<div class="pointer-events-none absolute inset-y-0 ml-px grid place-items-center px-2">
				<SearchIcon class="text-lg text-muted-fg" />
			</div>
			<input class={/* @once */ Input({ class: 'pl-8' })} placeholder="Search..." {...props} />
		</div>
	);
};

export default SearchInput;
