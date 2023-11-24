export interface InteractiveProps {
	class?: string;
	variant?: 'default' | 'muted' | 'danger';
}

export const Interactive = (props: InteractiveProps) => {
	const { class: className, variant = 'default' } = props;

	let cn = `outline-2 -outline-offset-2 outline-primary focus-visible:outline disabled:pointer-events-none`;

	if (variant === 'default') {
		cn += ` outline-accent hover:bg-secondary/30`;
	} else if (variant === 'muted') {
		cn += ` outline-accent hover:bg-secondary/10`;
	} else if (variant === 'danger') {
		cn += ` outline-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10`;
	}

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};

export const loadNewBtn = Interactive({
	variant: 'muted',
	class: `grid h-13 shrink-0 place-items-center border-b border-divider text-sm text-accent disabled:pointer-events-none`,
});

export const loadMoreBtn = Interactive({
	variant: 'muted',
	class: `grid h-13 shrink-0 place-items-center text-sm text-accent disabled:pointer-events-none`,
});
