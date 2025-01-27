import type { At } from '@atcute/client/lexicons';

import TimelineList from '~/com/components/lists/TimelineList';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface PostQuotedByDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const PostQuotedByPaneDialog = (props: PostQuotedByDialogProps) => {
	const { actor, rkey } = props;

	const { pane } = usePaneContext();

	const uri = `at://${actor}/app.bsky.feed.post/${rkey}`;

	return (
		<PaneDialog>
			<PaneDialogHeader title={`Quotes`} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<TimelineList uid={pane.uid} params={{ type: 'quote', uri }} />
			</div>
		</PaneDialog>
	);
};

export default PostQuotedByPaneDialog;
