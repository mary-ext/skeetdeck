import { type JSX, createEffect, createSignal } from 'solid-js';

import { Interactive } from '~/com/primitives/interactive';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';

import { usePaneContext } from './PaneContext';

export interface PaneBodyProps {
	autoRefresh?: boolean;
	isScrolled?: boolean;
	onScrolled?: (isScrolled: boolean) => void;
	children?: JSX.Element;
}

const scrollToTopBtn = Interactive({
	variant: 'none',
	class: `group pointer-events-auto overflow-hidden rounded-full border border-divider bg-background shadow-md`,
});

const PaneBody = (props: PaneBodyProps) => {
	let ref: HTMLDivElement | undefined;

	const { index } = usePaneContext()!;
	const [scrolled, setScrolled] = createSignal(false);

	createEffect((prev: number | undefined) => {
		const next = index();

		if (prev !== undefined && next !== prev) {
			// @fixme: for some reason we're stuck in a state where our scroll
			// position is at 0px but also not, so let's nudge it to 1px first.
			ref!.scrollTop = 1;
			ref!.scrollTop = 0;
		}

		return next;
	});

	return (
		<div class="relative min-h-0 grow">
			{(() => {
				if (scrolled()) {
					return (
						<div class="pointer-events-none absolute inset-x-0 top-0 z-10 grid place-items-center pt-2">
							<button onClick={() => ref!.scrollTo({ top: 0, behavior: 'auto' })} class={scrollToTopBtn}>
								<div class="flex items-center gap-2 px-4 py-1 group-hover:bg-secondary/30">
									<ArrowLeftIcon class="rotate-90 text-base" />
									<span class="text-de font-medium leading-5">Scroll to top</span>
								</div>
							</button>
						</div>
					);
				}
			})()}

			<div
				ref={ref}
				onScrollEnd={(ev) => setScrolled(ev.currentTarget.scrollTop > 26)}
				class="flex h-full flex-col overflow-y-auto"
			>
				{props.children}
			</div>
		</div>
	);
};

export default PaneBody;
