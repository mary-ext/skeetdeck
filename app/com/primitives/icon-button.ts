export interface IconButtonProps {
	class?: string;
	size?: 'md';
	color?: 'primary' | 'muted';
	edge?: 'left' | 'right';
}

const iconButton = (props: IconButtonProps = {}) => {
	const { class: className, size = 'md', color = 'primary', edge } = props;

	let cn = `grid place-items-center shrink-0 rounded-full text-muted-fg hover:bg-secondary`;

	if (size === 'md') {
		cn += ` h-8 w-8 text-lg`;
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

export default iconButton;
