export interface TextareaProps {
	class?: string;
}

export const Textarea = (props: TextareaProps = {}) => {
	const { class: className } = props;

	let cn = `block w-full resize-none rounded-md border border-input bg-transparent px-3 py-[0.45rem] text-sm outline-2 -outline-offset-1 outline-accent outline-none placeholder:text-muted-fg focus:outline disabled:opacity-50`;

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};
