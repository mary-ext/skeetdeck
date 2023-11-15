export interface InteractiveProps {
	class?: string;
}

export const Interactive = (props: InteractiveProps) => {
	const { class: className } = props;

	let cn = `outline-2 -outline-offset-2 outline-primary hover:bg-hinted focus-visible:outline`;

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};
