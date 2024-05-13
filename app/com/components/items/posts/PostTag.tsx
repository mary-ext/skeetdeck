import PoundIcon from '../../../icons/baseline-pound';
import { LINK_TAG, Link, type TagLinking } from '../../Link';

export interface PostTagProps {
	tag: string;
}

const PostTag = (props: PostTagProps) => {
	const link: TagLinking = {
		type: LINK_TAG,
		get tag() {
			return props.tag;
		},
	};

	return (
		<Link
			to={link}
			class="flex min-w-0 select-none items-center gap-1 rounded-full bg-secondary/30 px-2 leading-6 hover:bg-secondary/40"
		>
			<PoundIcon />
			<span class="overflow-hidden text-ellipsis whitespace-nowrap">{props.tag}</span>
		</Link>
	);
};

export default PostTag;
