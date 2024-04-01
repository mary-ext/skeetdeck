import type { JSX } from 'solid-js';

export interface ViewHeaderProps {
	children?: JSX.Element;
}

export const ViewHeader = (props: ViewHeaderProps) => {
	return (
		<div class="flex h-13 min-w-0 shrink-0 items-center gap-2 border-b border-divider px-4">
			{props.children}
		</div>
	);
};

export interface ViewHeadingProps {
	title: string;
	subtitle?: string;
}

export const ViewHeading = (props: ViewHeadingProps) => {
	return (
		<div class="flex min-w-0 grow flex-col gap-0.5">
			<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
				{props.title}
			</p>

			<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg empty:hidden">
				{props.subtitle}
			</p>
		</div>
	);
};

export interface ViewBodyProps {
	children?: JSX.Element;
}

export const ViewBody = (props: ViewBodyProps) => {
	return <div class="flex min-h-0 grow flex-col overflow-y-auto">{props.children}</div>;
};
