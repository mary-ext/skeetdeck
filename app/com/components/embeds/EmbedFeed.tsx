import type { UnionOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Link, LinkingType } from '../Link.tsx';

type EmbeddedFeed = UnionOf<'app.bsky.feed.defs#generatorView'>;

export interface EmbedFeedProps {
	feed: EmbeddedFeed;
}

const EmbedFeed = (props: EmbedFeedProps) => {
	const feed = () => props.feed;

	return (
		<Link
			to={{ type: LinkingType.PROFILE_FEED, actor: feed().creator.did, rkey: getRecordId(feed().uri) }}
			class="flex flex-col gap-2 rounded-md border border-divider p-3 text-left text-sm hover:bg-secondary"
		>
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
					{(() => {
						const avatar = feed().avatar;

						if (avatar) {
							return <img src={avatar} class="h-full w-full" />;
						}
					})()}
				</div>

				<div>
					<p class="font-bold">{feed().displayName}</p>
					<p class="text-muted-fg">Feed by @{feed().creator.handle}</p>
				</div>
			</div>
		</Link>
	);
};

export default EmbedFeed;
