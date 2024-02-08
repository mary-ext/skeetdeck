export interface InteractiveProps {
	class?: string;
	variant?: 'default' | 'muted' | 'white' | 'danger' | 'none';
	offset?: boolean;
	userSelect?: boolean;
}

export const Interactive = (props: InteractiveProps) => {
	const { class: className, variant = 'default', offset = true, userSelect = false } = props;

	let cn = `outline-2 focus-visible:outline disabled:pointer-events-none`;

	if (variant === 'default') {
		cn += ` outline-primary hover:bg-secondary/30`;
	} else if (variant === 'muted') {
		cn += ` outline-primary hover:bg-secondary/10`;
	} else if (variant === 'white') {
		cn += ` outline-white hover:bg-secondary/30`;
	} else if (variant === 'danger') {
		cn += ` outline-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10`;
	}

	if (offset) {
		cn += ` -outline-offset-2`;
	}

	if (!userSelect) {
		cn += ` select-none`;
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
