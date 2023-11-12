export interface TextareaProps {
	class?: string;
}

const textarea = (props: TextareaProps = {}) => {
	const { class: className } = props;

	let cn = `block w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-2 -outline-offset-1 outline-accent outline-none placeholder:text-muted-fg focus:outline disabled:opacity-50`;

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};

export default textarea;
