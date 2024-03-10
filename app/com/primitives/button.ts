export interface ButtonProps {
	class?: string;
	size?: 'xs' | 'sm' | null;
	variant?: 'primary' | 'danger' | 'outline' | 'ghost' | null;
	grow?: boolean;
}

export const Button = (props: ButtonProps = {}) => {
	const { class: className, size = 'sm', variant = 'outline', grow = false } = props;

	let cn = `inline-flex select-none items-center justify-center rounded-md font-medium outline-2 -outline-offset-1 outline-primary focus-visible:outline disabled:pointer-events-none disabled:opacity-50`;

	if (size === 'xs') {
		cn += ` h-8 px-3 text-sm leading-none`;
	} else if (size === 'sm') {
		cn += ` h-9 px-3 text-sm`;
	}

	if (variant === 'primary') {
		cn += ` bg-primary text-primary-fg hover:bg-primary/90 outline-offset-2`;
	} else if (variant === 'danger') {
		cn += ` bg-red-600 text-primary hover:bg-red-700 outline-offset-2`;
	} else if (variant === 'outline') {
		cn += ` border border-input hover:bg-secondary/30 hover:text-secondary-fg`;
	} else if (variant === 'ghost') {
		cn += ` hover:bg-secondary/30 hover:text-secondary-fg`;
	}

	if (grow) {
		cn += ` grow`;
	}

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};
