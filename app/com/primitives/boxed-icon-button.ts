export interface BoxedIconButtonProps {
	class?: string;
}

export const BoxedIconButton = (props: BoxedIconButtonProps = {}) => {
	const { class: className } = props;

	let cn = `inline-grid h-9 w-9 select-none place-items-center rounded-md border border-input text-base outline-2 -outline-offset-1 outline-primary hover:bg-secondary/30 hover:text-secondary-fg focus-visible:outline disabled:pointer-events-none disabled:opacity-50`;

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};
