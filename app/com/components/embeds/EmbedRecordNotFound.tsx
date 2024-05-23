import { getCollectionId } from '~/api/utils/misc';

export interface EmbedRecordNotFoundProps {
	/** Expected to be static */
	type?: 'post' | 'feed' | 'list' | 'record';
}

const EmbedRecordNotFound = ({ type = 'record' }: EmbedRecordNotFoundProps) => {
	return (
		<div class="rounded-md border border-divider p-3">
			<p class="text-sm text-muted-fg">This {type} is unavailable</p>
		</div>
	);
};

export default EmbedRecordNotFound;

const MAPPING: Record<string, EmbedRecordNotFoundProps['type']> = {
	'app.bsky.feed.post': 'post',
	'app.bsky.feed.generator': 'feed',
	'app.bsky.graph.list': 'list',
};

export const getCollectionMapping = (uri: string): EmbedRecordNotFoundProps['type'] => {
	const collection = getCollectionId(uri);
	return MAPPING[collection];
};
