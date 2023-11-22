export interface InteractiveProps {
	class?: string;
	variant?: 'default' | 'danger';
}

export const Interactive = (props: InteractiveProps) => {
	const { class: className, variant = 'default' } = props;

	let cn = `outline-2 -outline-offset-2 outline-primary hover:bg-hinted focus-visible:outline disabled:pointer-events-none`;

	if (variant === 'default') {
		cn += ` outline-accent hover:bg-hinted`;
	} else if (variant === 'danger') {
		cn += ` outline-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10`;
	}

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};
