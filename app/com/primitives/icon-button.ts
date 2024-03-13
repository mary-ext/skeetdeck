export interface IconButtonProps {
	class?: string;
	size?: 'md' | 'lg';
	color?: 'primary' | 'muted' | 'inherit' | null;
	edge?: 'left' | 'right';
}

export const IconButton = (props: IconButtonProps = {}) => {
	const { class: className, size = 'md', color = 'primary', edge } = props;

	let cn = `grid shrink-0 place-items-center rounded-full outline-2 -outline-offset-1 outline-primary outline-none hover:bg-secondary/40 focus-visible:outline disabled:pointer-events-none disabled:opacity-50`;

	if (size === 'md') {
		cn += ` h-8 w-8 text-lg`;
	} else if (size === 'lg') {
		cn += ` h-9 w-9 text-lg`;
	}

	if (color === 'primary') {
		cn += ` text-primary`;
	} else if (color === 'muted') {
		cn += ` text-muted-fg`;
	}

	if (edge === 'left') {
		cn += ` -ml-2`;
	} else if (edge === 'right') {
		cn += ` -mr-2`;
	}

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};
