import { type JSX } from 'solid-js';

import type { AppBskyEmbedRecord, AppBskyFeedDefs, At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import { LINK_POST, Link } from '../Link';

import EmbedRecordNotFound from './EmbedRecordNotFound';

type EmbeddedBlockedRecord = AppBskyEmbedRecord.ViewBlocked | AppBskyFeedDefs.BlockedPost;

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
								actor: getRepoId(record.uri) as At.DID,
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
