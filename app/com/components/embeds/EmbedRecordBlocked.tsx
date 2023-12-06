import { type JSX } from 'solid-js';

import type { DID, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import { LINK_POST, Link } from '../Link.tsx';

import EmbedRecordNotFound from './EmbedRecordNotFound.tsx';

type EmbeddedBlockedRecord = UnionOf<'app.bsky.embed.record#viewBlocked'>;

export interface EmbedRecordBlockedProps {
	record: EmbeddedBlockedRecord;
}

const EmbedRecordBlocked = (props: EmbedRecordBlockedProps) => {
	const render = () => {
		const record = props.record;

		if (record.author.viewer?.blocking) {
			return (
				<div class="flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
					<p class="m-3 text-sm text-muted-fg">Blocked post</p>

					<Link
						to={
							/* @once */ {
								type: LINK_POST,
								actor: getRepoId(record.uri) as DID,
								rkey: getRecordId(record.uri),
							}
						}
						class="flex items-center whitespace-nowrap px-4 text-sm font-medium hover:bg-secondary/30 hover:text-secondary-fg"
					>
						View
					</Link>
				</div>
			);
		}

		return <EmbedRecordNotFound />;
	};

	return render as unknown as JSX.Element;
};

export default EmbedRecordBlocked;
