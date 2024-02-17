import { batch, createEffect, createSignal } from 'solid-js';

import { type InfiniteData, createMutation } from '@pkg/solid-query';

import type { Records, RefOf, UnionOf } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { getRecordId } from '~/api/utils/misc';

import type { ThreadData } from '~/api/models/threads';
import { getPost, getPostKey } from '~/api/queries/get-post';
import type { getPostThreadKey } from '~/api/queries/get-post-thread';
import type { TimelinePage } from '~/api/queries/get-timeline';
import { type SignalizedPost, removeCachedPost } from '~/api/stores/posts';
import { producePostDelete } from '~/api/updaters/delete-post';

import { type ComposedImage, getImageFromBlob } from '~/utils/image';
import { modelChecked } from '~/utils/input';
import { signal } from '~/utils/signals';
import { mapDefined } from '~/utils/misc';

import { closeModal, useModalState } from '../../globals/modals';

import Checkbox from '../inputs/Checkbox';
import DialogOverlay from './DialogOverlay';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';

import { type GateState, useComposer } from '~/desktop/components/composer/ComposerContext';

export interface DeletePostConfirmDialogProps {
	/** Expected to be static */
	post: SignalizedPost;
}

const DeletePostConfirmDialog = (props: DeletePostConfirmDialogProps) => {
	const deleteMutation = createMutation((queryClient) => {
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
				closeModal();
			},
			onSuccess: () => {
				const [updateTimeline, updatePostThread] = producePostDelete(postUri);

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

				// 3. Reset post queries
				queryClient.resetQueries({
					queryKey: ['getPost'],
					predicate: (query) => {
						const [, , uri] = query.queryKey as ReturnType<typeof getPostKey>;
						return uri === postUri;
					},
				});

				// 4. Mutate all timeline and post thread queries
				queryClient.setQueriesData<InfiniteData<TimelinePage>>({ queryKey: ['getTimeline'] }, (data) => {
					if (data) {
						return updateTimeline(data);
					}

					return data;
				});

				queryClient.setQueriesData<ThreadData>({ queryKey: ['getPostThread'] }, (data) => {
					if (data) {
						const post = data.post;
						const root = post.record.value.reply?.root.uri;

						// Our posts can be in 3 different places here:
						// 1. the main URI is the root of our post.
						// 3. the root URI is the root of our post.
						if (post.uri === rootUri || (root && root === rootUri)) {
							return updatePostThread(data);
						}
					}

					return data;
				});

				// 5. Re-fetch the parent post to get an accurate view over the reply count
				if (parentUri) {
					queryClient.fetchQuery({
						queryKey: getPostKey(post.uid, parentUri),
						queryFn: getPost,
						staleTime: 0,
					});
				}
			},
		};
	});

	const redraftMutation = createMutation(() => {
		const context = useComposer();

		return {
			mutationFn: async () => {
				const post = props.post;
				const record = post.record.value;
				const threadgate = post.threadgate.value?.record as Records['app.bsky.feed.threadgate'] | undefined;

				const uid = post.uid;
				const agent = await multiagent.connect(uid);

				let externalEmbedUri: string | undefined;
				let recordEmbedUri: string | undefined;
				let imageRefs: RefOf<'app.bsky.embed.images#image'>[] = [];

				{
					const embed = record.embed;

					if (embed) {
						const type = embed.$type;

						if (type === 'app.bsky.embed.external') {
							externalEmbedUri = embed.external.uri;
						} else if (type === 'app.bsky.embed.images') {
							imageRefs = embed.images;
						} else if (type === 'app.bsky.embed.record') {
							recordEmbedUri = embed.record.uri;
						} else if (type === 'app.bsky.embed.recordWithMedia') {
							const media = embed.media;
							const mediaType = media.$type;

							recordEmbedUri = embed.record.record.uri;

							if (mediaType === 'app.bsky.embed.external') {
								externalEmbedUri = media.external.uri;
							} else if (mediaType === 'app.bsky.embed.images') {
								imageRefs = media.images;
							}
						}
					}
				}

				const images = await Promise.all(
					imageRefs.map(async (data): Promise<ComposedImage> => {
						const raw = data.image;

						const response = await agent.rpc.get('com.atproto.sync.getBlob', {
							params: {
								did: uid,
								cid: raw.ref.$link,
							},
						});

						const uint8 = response.data as Uint8Array;
						const blob = new Blob([uint8], { type: raw.mimeType });

						const image = await getImageFromBlob(blob);

						return {
							blob: blob,
							ratio: {
								height: image.naturalHeight,
								width: image.naturalWidth,
							},
							alt: signal(data.alt),
						};
					}),
				);

				batch(() => {
					context.open = true;
					context.author = uid;
					context.state = {
						reply: record.reply?.parent?.uri,
						posts: [
							{
								text: record.text,
								external: externalEmbedUri,
								images: images,
								labels: record.labels ? [...record.labels.values.map((label) => label.val)] : [],
								languages: record.langs ? [...record.langs] : [],
								record: recordEmbedUri,
								tags: record.tags ? [...record.tags] : [],
								_parsed: null,
							},
						],
						gate: parseGateRules(threadgate?.allow),
					};
				});
			},
		};
	});

	const [redraft, setRedraft] = createSignal(false);
	const { disableBackdropClose } = useModalState();

	createEffect(() => {
		disableBackdropClose.value = redraftMutation.isPending;
	});

	return (
		<DialogOverlay>
			<fieldset disabled={disableBackdropClose.value} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Delete post?</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
					<p class="text-sm">
						This can't be undone, the post will be removed from your profile, the timeline of any users that
						follows you, and from search results.
					</p>

					<label class="flex items-center gap-3 pb-2">
						<Checkbox ref={modelChecked(redraft, setRedraft)} />
						<span class="text-sm">Redraft this post</span>
					</label>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						onClick={async () => {
							if (redraft()) {
								await redraftMutation.mutateAsync();
							}

							closeModal();
							deleteMutation.mutate();
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Delete
					</button>
				</div>
			</fieldset>
		</DialogOverlay>
	);
};

export default DeletePostConfirmDialog;

type Rule =
	| UnionOf<'app.bsky.feed.threadgate#followingRule'>
	| UnionOf<'app.bsky.feed.threadgate#listRule'>
	| UnionOf<'app.bsky.feed.threadgate#mentionRule'>;

const parseGateRules = (rules: Rule[] | undefined): GateState => {
	if (rules) {
		if (rules.length === 1) {
			const rule = rules[0];

			if (rule.$type === 'app.bsky.feed.threadgate#followingRule') {
				return { type: 'f' };
			}
			if (rule.$type === 'app.bsky.feed.threadgate#mentionRule') {
				return { type: 'm' };
			}
		}

		return {
			type: 'c',
			follows: rules.some((r) => r.$type === 'app.bsky.feed.threadgate#followingRule'),
			mentions: rules.some((r) => r.$type === 'app.bsky.feed.threadgate#mentionRule'),
			lists: mapDefined(rules, (r) => (r.$type === 'app.bsky.feed.threadgate#listRule' ? r.list : undefined)),
		};
	}

	return { type: 'e' };
};
