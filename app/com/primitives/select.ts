export interface SelectProps {
	class?: string;
}

export const Select = (props: SelectProps = {}) => {
	const { class: className } = props;

	let cn = `text-sm rounded-md border border-input bg-background px-3 py-2 text-primary outline-2 -outline-offset-1 outline-accent outline-none focus:outline disabled:opacity-50`;

	if (className) {
		return `${cn} ${className}`;
	}

	return cn;
};
