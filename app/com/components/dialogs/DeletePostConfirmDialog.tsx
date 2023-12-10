import { type InfiniteData, useQueryClient, createMutation } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import type { ThreadPage } from '~/api/models/thread.ts';
import { getPost, getPostKey } from '~/api/queries/get-post.ts';
import type { getPostThreadKey } from '~/api/queries/get-post-thread.ts';
import type { TimelinePage } from '~/api/queries/get-timeline.ts';
import { type SignalizedPost, removeCachedPost } from '~/api/stores/posts.ts';
import { producePostDelete } from '~/api/updaters/delete-post.ts';

import { closeModal } from '~/com/globals/modals.tsx';

import ConfirmDialog from './ConfirmDialog.tsx';

export interface DeletePostConfirmDialogProps {
	/** Expected to be static */
	post: SignalizedPost;
}

const DeletePostConfirmDialog = (props: DeletePostConfirmDialogProps) => {
	const queryClient = useQueryClient();

	const deleteMutation = createMutation(() => {
		const post = props.post;

		const postUri = post.uri;
		const parentUri = post.record.value.reply?.parent.uri;
		const rootUri = post.record.value.reply?.root.uri;

		const did = post.uid;
		const handle = post.author.handle.value;
		const rkey = getRecordId(postUri);

		return {
			mutationFn: async () => {
				const agent = await multiagent.connect(did);

				await agent.rpc.call('com.atproto.repo.deleteRecord', {
					data: {
						repo: did,
						collection: 'app.bsky.feed.post',
						rkey: rkey,
					},
				});
			},
			onMutate: () => {
				const [updateTimeline, updatePostThread] = producePostDelete(postUri);

				closeModal();

				// 1. Remove our cached post
				removeCachedPost(did, postUri);

				// 2. Reset any post thread queries that directly shows the post
				queryClient.resetQueries({
					queryKey: ['getPostThread'],
					predicate: (query) => {
						const [, , actor, post] = query.queryKey as ReturnType<typeof getPostThreadKey>;
						return post === rkey && (actor === did || actor === handle);
					},
				});

				// 3. Mutate all timeline and post thread queries
				queryClient.setQueriesData<InfiniteData<TimelinePage>>({ queryKey: ['getTimeline'] }, (data) => {
					if (data) {
						return updateTimeline(data);
					}

					return data;
				});

				queryClient.setQueriesData<ThreadPage>({ queryKey: ['getPostThread'] }, (data) => {
					if (data) {
						const post = data.post;
						const root = post.record.value.reply?.root.uri;

						// Our posts can be in 3 different places here:
						// 1. the main URI is the root of our post.
						// 3. the root URI is the root of our post.
						// 2. the root URI is our post.
						if (post.uri === rootUri || (root && (root === rootUri || root === postUri))) {
							return updatePostThread(data);
						}
					}

					return data;
				});
			},
			onSuccess: () => {
				if (parentUri) {
					// Re-fetch the parent post to get an accurate view over the reply count
					queryClient.fetchQuery({
						queryKey: getPostKey(post.uid, parentUri),
						queryFn: getPost,
						staleTime: 0,
					});
				}
			},
		};
	});

	return (
		<ConfirmDialog
			title={`Delete post?`}
			body={`This can't be undone, the post will be removed from your profile, the timeline of any users that follows you, and from search results.`}
			confirmation={`Delete`}
			onConfirm={() => deleteMutation.mutate()}
		/>
	);
};

export default DeletePostConfirmDialog;
