import { type JSX, Show, createEffect, createSignal } from 'solid-js';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';

import { usePaneContext } from './PaneContext.tsx';

export interface PaneBodyProps {
	autoRefresh?: boolean;
	isScrolled?: boolean;
	onScrolled?: (isScrolled: boolean) => void;
	children?: JSX.Element;
}

const PaneBody = (props: PaneBodyProps) => {
	let ref: HTMLDivElement | undefined;

	const { index } = usePaneContext()!;

	const onScrolled = props.onScrolled;

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
		<div class="min-h-0 grow">
			{(() => {
				if (props.isScrolled) {
					return (
						<div class="pointer-events-none absolute inset-x-0 top-13 z-10 grid place-items-center pt-4">
							<button
								onClick={() => (ref!.scrollTop = 0)}
								class="pointer-events-auto flex items-center gap-2 rounded-full bg-accent px-4 py-1 text-[0.8125rem] font-medium leading-5 text-white shadow-md shadow-primary hover:bg-accent-dark dark:shadow-background"
							>
								<ArrowLeftIcon class="rotate-90 stroke-white stroke-1 text-base" />
								<span>Auto-refresh paused</span>
							</button>
						</div>
					);
				}
			})()}

			<div
				ref={ref}
				onScrollEnd={onScrolled && ((ev) => onScrolled(ev.currentTarget.scrollTop > 26))}
				class="flex h-full flex-col overflow-y-auto"
			>
				{props.children}
			</div>
		</div>
	);
};

export default PaneBody;
