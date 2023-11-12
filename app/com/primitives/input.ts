interface InputProps {
	class?: string;
}

const input = (props: InputProps = {}) => {
	const { class: className } = props;

	let cn =
		'block h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-2 -outline-offset-1 outline-accent outline-none placeholder:text-muted-fg focus:outline disabled:opacity-50';

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};

export default input;
