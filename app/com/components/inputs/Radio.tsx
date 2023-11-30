import type { ComponentProps } from 'solid-js';

const Radio = (props: ComponentProps<'input'>) => {
	return (
		<label class="relative inline-flex h-5 w-5 shrink-0 cursor-pointer text-xl">
			<input {...props} type="radio" class="peer h-0 w-0 appearance-none leading-none outline-none" />

			<div class="pointer-events-none absolute -inset-2 rounded-full peer-hover:bg-secondary/20 peer-focus-visible:bg-secondary/20" />

			<div class="z-10 h-5 w-5 rounded-full border-2 border-secondary bg-background peer-checked:hidden"></div>
			<div class="z-10 hidden h-5 w-5 place-items-center rounded-full bg-accent peer-checked:grid">
				<div class="h-2 w-2 rounded-full bg-white"></div>
			</div>
		</label>
	);
};

export default Radio;
