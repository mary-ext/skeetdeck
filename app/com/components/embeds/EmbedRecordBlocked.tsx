import { Match, Switch } from 'solid-js';

import type { DID, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import { Link, LinkingType } from '../Link.tsx';

import EmbedRecordNotFound from './EmbedRecordNotFound.tsx';

type EmbeddedBlockedRecord = UnionOf<'app.bsky.embed.record#viewBlocked'>;

export interface EmbedRecordBlockedProps {
	record: EmbeddedBlockedRecord;
}

const EmbedRecordBlocked = (props: EmbedRecordBlockedProps) => {
	const record = () => props.record;

	return (
		<Switch>
			<Match when={record().author.viewer?.blocking}>
				<div class="flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
					<p class="m-3 text-sm text-muted-fg">Blocked post</p>

					<Link
						to={{
							type: LinkingType.POST,
							actor: getRepoId(record().uri) as DID,
							rkey: getRecordId(record().uri),
						}}
						class="flex items-center whitespace-nowrap px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
					>
						View
					</Link>
				</div>
			</Match>

			<Match when>
				<EmbedRecordNotFound />
			</Match>
		</Switch>
	);
};

export default EmbedRecordBlocked;
