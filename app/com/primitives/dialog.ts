export interface DialogRootProps {
	class?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	maxHeight?: 'sm' | 'md';
	fullHeight?: boolean;
}

export const DialogRoot = (props: DialogRootProps = {}) => {
	const { class: className, size = 'md', maxHeight = 'md', fullHeight } = props;

	let cn = `flex w-full flex-col overflow-hidden rounded-lg bg-background`;

	if (size === 'sm') {
		cn += ` sm:max-w-md`;
	} else if (size === 'md') {
		cn += ` sm:max-w-lg`;
	} else if (size === 'lg') {
		cn += ` sm:max-w-xl`;
	} else if (size === 'xl') {
		cn += ` sm:max-w-2xl`;
	}

	if (maxHeight === 'sm') {
		cn += ` max-h-141`;
	} else if (maxHeight === 'md') {
		cn += ` max-h-[680px]`;
	}

	if (fullHeight) {
		cn += ` h-full`;
	}

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};

export interface DialogHeaderProps {
	divider?: boolean;
}

export const DialogHeader = (props: DialogHeaderProps = {}) => {
	const { divider } = props;

	let cn = `flex h-13 shrink-0 items-center gap-2 px-4`;

	if (divider) {
		cn += ` border-b border-divider`;
	}

	return cn;
};

export interface DialogTitleProps {}

export const DialogTitle = (_props: DialogTitleProps = {}) => {
	let cn = `grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold`;

	return cn;
};

export interface DialogBodyProps {
	class?: string;
	padded?: boolean;
	scrollable?: boolean;
}

export const DialogBody = (props: DialogBodyProps = {}) => {
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

export const DialogActions = (_props: DialogActionsProps = {}) => {
	let cn = `flex shrink-0 items-center justify-end gap-2 p-4`;

	return cn;
};
