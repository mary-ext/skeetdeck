export interface DialogRootProps {
	size?: 'sm' | 'md' | 'lg' | 'xl';
	fullHeight?: boolean;
}

export const root = (props: DialogRootProps = {}) => {
	const { size = 'md', fullHeight } = props;

	let cn = `flex max-h-full w-full flex-col overflow-hidden rounded-lg bg-background`;

	if (size === 'sm') {
		cn += ` sm:max-w-md`;
	} else if (size === 'md') {
		cn += ` sm:max-w-lg`;
	} else if (size === 'lg') {
		cn += ` sm:max-w-xl`;
	} else if (size === 'xl') {
		cn += ` sm:max-w-5xl`;
	}

	if (fullHeight) {
		cn += ` h-full`;
	}

	return cn;
};

export interface DialogHeaderProps {
	divider?: boolean;
}

export const header = (props: DialogHeaderProps = {}) => {
	const { divider } = props;

	let cn = `flex h-13 shrink-0 items-center gap-2 px-4`;

	if (divider) {
		cn += ` border-b border-divider`;
	}

	return cn;
};

export interface DialogTitleProps {}

export const title = (_props: DialogTitleProps = {}) => {
	let cn = `grow text-base font-bold`;

	return cn;
};

export interface DialogBodyProps {
	class?: string;
	padded?: boolean;
	scrollable?: boolean;
}

export const body = (props: DialogBodyProps = {}) => {
	const { class: className, padded = true, scrollable = false } = props;

	let cn = `grow shrink`;

	if (padded) {
		cn += ` px-4`;
	}

	if (scrollable) {
		cn += ` overflow-y-auto`;
	} else {
		cn += ` overflow-y-visible`;
	}

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};

export interface DialogActionsProps {}

export const actions = (_props: DialogActionsProps = {}) => {
	let cn = `flex shrink-0 items-center justify-end gap-2 p-4`;

	return cn;
};
