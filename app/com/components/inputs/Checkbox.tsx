import type { ComponentProps } from 'solid-js';

import CheckIcon from '~/com/icons/baseline-check.tsx';

const Checkbox = (props: ComponentProps<'input'>) => {
	return (
		<label class="relative inline-flex  cursor-pointer text-xl">
			<input {...props} type="checkbox" class="peer h-0 w-0 appearance-none leading-none" />

			<div class="pointer-events-none absolute -inset-2 rounded-full peer-hover:bg-hinted peer-focus-visible:bg-hinted" />

			<div class="z-10 h-5 w-5 rounded border-2 border-secondary peer-checked:hidden"></div>
			<div class="z-10 hidden h-5 w-5 place-items-center rounded bg-accent peer-checked:grid">
				<CheckIcon class="stroke-white stroke-1 text-sm" />
			</div>
		</label>
	);
};

export default Checkbox;
