import { type JSX, For, Show, batch, createEffect, createMemo, createSignal, untrack, lazy } from 'solid-js';
import { unwrap } from 'solid-js/store';

import { createQuery, useQueryClient } from '@pkg/solid-query';
import { makeEventListener } from '@solid-primitives/event-listener';

import type { DID, Records, RefOf, UnionOf } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { extractAppLink } from '~/api/utils/links.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';
import { getCollectionId, isDid } from '~/api/utils/misc.ts';

import type { ThreadData } from '~/api/models/threads.ts';
import { getUploadedBlob, uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info.ts';
import { type LinkMeta, getLinkMeta, getLinkMetaKey } from '~/api/queries/get-link-meta.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info.ts';
import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';
import { getResolvedHandle, getResolvedHandleKey } from '~/api/queries/get-resolved-handle.ts';
import type { getTimelineLatestKey } from '~/api/queries/get-timeline.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';
import { produceThreadInsert } from '~/api/updaters/insert-post.ts';

import { type PreliminaryRichText, finalizeRt, getRtLength } from '~/api/richtext/composer.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { preferences } from '~/desktop/globals/settings.ts';

import { languageNames } from '~/utils/intl/display-names.ts';
import { type PendingImage, compressPostImage } from '~/utils/image.ts';
import { isMac } from '~/utils/interaction.ts';
import { clsx, getUniqueId } from '~/utils/misc.ts';
import { Signal, signal } from '~/utils/signals.ts';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import RichtextComposer from '~/com/components/richtext/RichtextComposer.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';

import ImageCompressAlertDialog from '~/com/components/dialogs/ImageCompressAlertDialog.tsx';
import EmojiFlyout from '~/com/components/emojis/EmojiFlyout.tsx';

import { EmbedFeedContent } from '~/com/components/embeds/EmbedFeed.tsx';
import { EmbedLinkContent } from '~/com/components/embeds/EmbedLink.tsx';
import { EmbedListContent } from '~/com/components/embeds/EmbedList.tsx';
import { EmbedQuoteContent } from '~/com/components/embeds/EmbedQuote.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import CheckIcon from '~/com/icons/baseline-check.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';
import EmojiEmotionsIcon from '~/com/icons/baseline-emoji-emotions.tsx';
import ImageIcon from '~/com/icons/baseline-image.tsx';
import LanguageIcon from '~/com/icons/baseline-language.tsx';
import LinkIcon from '~/com/icons/baseline-link.tsx';
import ShieldIcon from '~/com/icons/baseline-shield.tsx';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import SwitchAccountAction from '../flyouts/SwitchAccountAction.tsx';

import { createComposerState, createPostState, isStateFilled, useComposer } from './ComposerContext.tsx';
import DummyPost from './DummyPost.tsx';
import TagsInput from './TagInput.tsx';

import ContentWarningAction from './actions/ContentWarningAction.tsx';
import PostLanguageAction from './actions/PostLanguageAction.tsx';
import ThreadgateAction, {
	buildGateRules,
	renderGateAlt,
	renderGateIcon,
} from './actions/ThreadgateAction.tsx';

import ImageAltDialog from './dialogs/ImageAltDialog.tsx';
import ImageAltReminderDialog from './dialogs/ImageAltReminderDialog.tsx';

const ViewDraftsDialog = lazy(() => import('./dialogs/ViewDraftsDialog.tsx'));

let cidPromise: Promise<typeof import('./utils/cid.ts')>;

const GRAPHEME_LIMIT = 300;
const MAX_THREAD_LIMIT = 9;
const MAX_IMAGE_LIMIT = 4;
const MAX_EXTERNAL_TAGS_LIMIT = 8;

const toolbarIcon = IconButton({ size: 'lg', class: 'text-primary/85 hover:text-primary' });

const removeEmbedBtn = Interactive({
	variant: 'none',
	class: `absolute right-1 top-1 z-20 grid h-7 w-7 place-items-center rounded-full bg-background text-base text-primary hover:bg-secondary`,
});

const removeImageBtn = Interactive({
	variant: 'white',
	class: `absolute right-1 top-1 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-base text-white backdrop-blur`,
});

const linkEmbedBtn = Interactive({
	class: `flex items-center gap-3 rounded-md border border-divider px-3 py-2.5 text-left text-sm`,
});

const enum LogType {
	NONE,
	ERROR,
	PENDING,
}

interface LogState {
	t: LogType;
	m: string;
}

type PostRecord = Records['app.bsky.feed.post'];
type ThreadgateRecord = Records['app.bsky.feed.threadgate'];

type PostRecordEmbed = PostRecord['embed'];
type StrongRef = RefOf<'com.atproto.repo.strongRef'>;

const logNone: LogState = { t: LogType.NONE, m: '' };
const logError = (m: string): LogState => ({ t: LogType.ERROR, m: m });
const logPending = (m: string): LogState => ({ t: LogType.PENDING, m: m });

const RESOLVED_RT = new WeakMap<PreliminaryRichText, Awaited<ReturnType<typeof finalizeRt>>>();

const resolveRt = async (uid: DID, prelim: PreliminaryRichText) => {
	let resolved = RESOLVED_RT.get(prelim);
	if (resolved === undefined) {
		RESOLVED_RT.set(prelim, (resolved = await finalizeRt(uid, prelim)));
	}
};

class ComposeError extends Error {
	name = 'ComposeError';
}

const ComposerPane = () => {
	const inputId = getUniqueId();

	const queryClient = useQueryClient();
	const context = useComposer();

	const state = context.state;
	const posts = state.posts;

	const [log, setLog] = createSignal<LogState>(logNone);

	const author = createMemo(() => multiagent.accounts.find((acc) => acc.did === context.author));

	const replying = createQuery(() => {
		const reply = state.reply;
		const key = getPostKey(context.author, reply ?? '');

		return {
			enabled: reply !== undefined,
			queryKey: key,
			queryFn: getPost,
			initialData: () => getInitialPost(key),
		};
	});

	const hasContents = createMemo(() => isStateFilled(state));

	const isSubmitDisabled = createMemo(() => {
		if (log().t === LogType.PENDING || (state.reply && !replying.data)) {
			return true;
		}

		for (let i = 0, il = posts.length; i < il; i++) {
			const draft = posts[i];
			const length = getRtLength(draft.rt);

			if (length > GRAPHEME_LIMIT || (!draft.external && draft.images.length < 1 && length < 1)) {
				return true;
			}
		}

		return false;
	});

	const submitPost = async () => {
		if (isSubmitDisabled()) {
			return;
		}

		setLog(logPending(``));

		const uid = context.author;
		const agent = await multiagent.connect(uid);

		const posts = unwrap(state.posts);

		// This holds whatever is required from the crawling process.
		const cache = new Map<string, any>();

		// These two variables are necessary for invalidation/mutation purposes
		const uris: string[] = [];
		let topReplyTo: RefOf<'app.bsky.feed.post#replyRef'> | undefined;

		try {
			// 1. Crawl through the posts, resolve all the facets and blobs
			{
				let imgCount = 0;
				let linkCount = 0;
				let embedCount = 0;

				for (let i = 0, il = posts.length; i < il; i++) {
					const draft = posts[i];

					const rt = draft.rt;
					const images = draft.images;
					const external = draft.external;
					const record = draft.record;

					{
						setLog(logPending(`Resolving rich text #${i + 1}`));
						await resolveRt(uid, rt);
					}

					for (let j = 0, jl = images.length; j < jl; j++) {
						const img = images[j];
						const blob = img.blob;

						setLog(logPending(`Uploading image #${++imgCount}`));

						try {
							await uploadBlob(uid, blob);
						} catch (err) {
							throw new ComposeError(`Failed to upload image #${imgCount}`, { cause: err });
						}
					}

					if (external) {
						setLog(logPending(`Resolving link embed #${++linkCount}`));

						const meta = await queryClient.fetchQuery({
							queryKey: getLinkMetaKey(external),
							queryFn: getLinkMeta,
						});

						const thumb = meta.thumb;

						if (thumb && !getUploadedBlob(uid, thumb)) {
							setLog(logPending(`Uploading link thumbnail #${linkCount}`));

							try {
								await uploadBlob(uid, thumb);
							} catch (err) {
								throw new ComposeError(`Failed to upload link thumbnail #${linkCount}`, { cause: err });
							}
						}

						cache.set(external, meta);
					}

					if (record) {
						setLog(logPending(`Resolving embed #${++embedCount}`));

						const ns = getCollectionId(record);
						let promise!: Promise<{ cid: Signal<string>; uri: string }>;

						if (ns === 'app.bsky.feed.post') {
							promise = queryClient.fetchQuery({
								queryKey: getPostKey(uid, record),
								queryFn: getPost,
							});
						} else if (ns === 'app.bsky.feed.generator') {
							promise = queryClient.fetchQuery({
								queryKey: getFeedInfoKey(uid, record),
								queryFn: getFeedInfo,
							});
						} else if (ns === 'app.bsky.graph.list') {
							promise = queryClient.fetchQuery({
								queryKey: getListInfoKey(uid, record),
								queryFn: getListInfo,
							});
						}

						const data = await promise;
						cache.set(record, data);
					}
				}
			}

			// 2. Send them all!
			{
				setLog(logPending(`Sending post`));

				const writes: UnionOf<'com.atproto.repo.applyWrites#create'>[] = [];
				const date = new Date();

				// Create post records
				{
					let replyTo: RefOf<'app.bsky.feed.post#replyRef'> | undefined;

					// Resolve the record
					if (replying.data) {
						const post = replying.data!;
						const replyRel = post.record.value.reply;

						const ref: StrongRef = {
							cid: post.cid.value,
							uri: post.uri,
						};

						topReplyTo = replyTo = {
							root: replyRel?.root || ref,
							parent: ref,
						};
					}

					for (let i = 0, il = posts.length; i < il; i++) {
						// Careful, `cborg` does not like undefined values, and we need to use
						// it to calculate the correct CID values for StrongRef in replies.

						// The timeline arbitrarily sorts the posts if they share the same
						// createdAt date, we'll increment the date by one milisecond for
						// each post in the chain.
						date.setMilliseconds(i);

						const draft = posts[i];
						const rkey = getCurrentTid();
						const uri = `at://${uid}/app.bsky.feed.post/${rkey}`;

						const rt = RESOLVED_RT.get(draft.rt)!;

						let embed: PostRecord['embed'] | undefined;

						{
							const images = draft.images;
							const external = draft.external;
							const record = draft.record;

							if (images.length > 0) {
								embed = {
									$type: 'app.bsky.embed.images',
									images: images.map((img) => ({
										image: getUploadedBlob(uid, img.blob)!,
										alt: img.alt.value,
										aspectRatio: img.ratio,
									})),
								};
							}

							if (external) {
								const data = cache.get(external) as LinkMeta;

								const ext: RefOf<'app.bsky.embed.external#external'> = {
									uri: data.uri,
									title: data.title,
									description: data.description,
								};

								if (data.thumb) {
									ext.thumb = getUploadedBlob(uid, data.thumb)!;
								}

								embed = {
									$type: 'app.bsky.embed.external',
									external: ext,
								};
							}

							if (record) {
								const data = cache.get(record) as { cid: Signal<string>; uri: string };

								const rec: PostRecordEmbed = {
									$type: 'app.bsky.embed.record',
									record: {
										cid: data.cid.value,
										uri: data.uri,
									},
								};

								if (
									embed &&
									(embed.$type === 'app.bsky.embed.images' || embed.$type === 'app.bsky.embed.external')
								) {
									embed = {
										$type: 'app.bsky.embed.recordWithMedia',
										media: embed,
										record: rec,
									};
								} else {
									embed = rec;
								}
							}
						}

						// `$type` has to exist here, because the PDS calculates CID *with*
						// the field present, so if we don't include it we're gonna have
						// mismatching CIDs
						const record: PostRecord & { $type: 'app.bsky.feed.post' } = {
							$type: 'app.bsky.feed.post',
							createdAt: date.toISOString(),
							text: rt.text,
							facets: rt.facets,
						};

						if (replyTo) {
							record.reply = replyTo;
						}

						if (embed) {
							record.embed = embed;
						}

						if (draft.tags.length > 0) {
							record.tags = draft.tags;
						}

						if (draft.languages.length > 0) {
							record.langs = draft.languages;
						}

						if (draft.labels.length > 0) {
							record.labels = {
								$type: 'com.atproto.label.defs#selfLabels',
								values: draft.labels.map((v) => ({ val: v })),
							};
						}

						// No need to calculate CID for the last post
						if (i !== il - 1) {
							const { serializeRecordCid } = await (cidPromise ||= import('./utils/cid.ts'));

							const serialized = await serializeRecordCid(record);

							const ref: StrongRef = {
								cid: serialized,
								uri: uri,
							};

							if (!replyTo) {
								replyTo = {
									root: ref,
									parent: ref,
								};
							} else {
								replyTo = {
									root: replyTo.root,
									parent: ref,
								};
							}
						}

						uris.push(uri);

						writes.push({
							$type: 'com.atproto.repo.applyWrites#create',
							collection: 'app.bsky.feed.post',
							rkey: rkey,
							value: record,
						});
					}
				}

				// Create threadgate record
				{
					const rules = buildGateRules(state.gate);
					if (rules) {
						const rkey = writes[0].rkey!;

						date.setMilliseconds(0);

						const record: ThreadgateRecord = {
							createdAt: date.toISOString(),
							post: `at://${uid}/app.bsky.feed.post/${rkey}`,
							allow: rules,
						};

						writes.push({
							$type: 'com.atproto.repo.applyWrites#create',
							collection: 'app.bsky.feed.threadgate',
							rkey: rkey,
							value: record,
						});
					}
				}

				// Let's send it
				{
					await agent.rpc.call('com.atproto.repo.applyWrites', {
						data: {
							repo: uid,
							writes: writes,
						},
					});
				}
			}
		} catch (err) {
			setLog(logError(err instanceof ComposeError ? err.message : `Something went wrong, try again later.`));
			console.error(err);

			return;
		}

		// We're done here, let's reset this entire state.
		{
			context.state = createComposerState(preferences);
		}

		// Anything afterwards is not necessary for the composer functionality,
		// here we'll just invalidate/mutate timelines and threads.
		{
			// 1. If it's attached to a reply, let's insert it to the threads.
			if (replying.data) {
				const rootUri = topReplyTo!.root.uri;
				const parentUri = replying.data.uri;

				const results = await Promise.allSettled([
					// We don't really need the parent posts for anything else other than
					// updating the reply counts properly.
					queryClient.fetchQuery({
						queryKey: getPostKey(uid, parentUri),
						queryFn: getPost,
						staleTime: 0,
					}),

					...uris.map((uri) =>
						queryClient.fetchQuery({
							queryKey: getPostKey(uid, uri),
							queryFn: getPost,
						}),
					),
				]);

				const posts: SignalizedPost[] = [];
				for (let i = 1, ilen = results.length; i < ilen; i++) {
					const result = results[i];

					// We shouldn't continue the chain if it's broken
					if (result.status !== 'fulfilled') {
						break;
					}

					posts.push(result.value);
				}

				if (posts.length > 0) {
					const updatePostThread = produceThreadInsert(posts, parentUri);

					queryClient.setQueriesData<ThreadData>(
						{
							queryKey: ['getPostThread', uid],
						},
						(data) => {
							if (data) {
								const post = data.post;

								const postUri = post.uri;
								const reply = post.record.value.reply;

								if (postUri === parentUri || postUri === rootUri || reply?.root.uri == rootUri) {
									return updatePostThread(data);
								}
							}

							return data;
						},
					);
				}
			}

			// 2. Invalidate the timeline
			queryClient.invalidateQueries({
				queryKey: ['getTimelineLatest'],
				predicate: (query) => {
					const [, , params] = query.queryKey as ReturnType<typeof getTimelineLatestKey>;
					return params.type !== 'profile' || params.actor === uid;
				},
			});
		}
	};

	const handleSubmitPrereq = () => {
		if (isSubmitDisabled()) {
			return;
		}

		// Check if every media has alt text provided
		if (preferences.a11y.warnNoMediaAlt) {
			const posts = unwrap(state.posts);

			for (let i = 0, il = posts.length; i < il; i++) {
				const draft = posts[i];

				if (draft.images.some((image) => !image.alt.value)) {
					openModal(() => <ImageAltReminderDialog onIgnore={submitPost} />);
					return;
				}
			}
		}

		submitPost();
	};

	createEffect(() => {
		// Remove threadgating if reply is set
		if (state.reply) {
			state.gate = { type: 'e' };
		}
	});

	createEffect(() => {
		if (hasContents()) {
			makeEventListener(window, 'beforeunload', (ev) => {
				ev.preventDefault();
				context.open = true;
			});
		}
	});

	return (
		<div class="flex w-96 shrink-0 flex-col border-r border-divider">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title={`Close composer`}
					onClick={() => {
						context.open = false;
					}}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<div class="grow"></div>

				{log().t !== LogType.PENDING ? (
					<div class="contents">
						<button
							onClick={() => {
								openModal(() => <ViewDraftsDialog />);
							}}
							class={/* @once */ Button({ variant: 'ghost', size: 'xs', class: 'text-primary/85' })}
						>
							Drafts
						</button>

						<button
							disabled={isSubmitDisabled()}
							onClick={handleSubmitPrereq}
							class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
						>
							Post
						</button>
					</div>
				) : (
					<>
						<span class="px-2 text-de text-muted-fg">{log().m}</span>
						<CircularProgress />
					</>
				)}
			</div>

			{log().t === LogType.ERROR && (
				<div class="shrink-0 bg-red-800 px-4 py-3 text-sm text-white">{log().m}</div>
			)}

			<fieldset
				disabled={log().t === LogType.PENDING}
				onKeyDown={(ev) => {
					const key = ev.key;

					if ((isMac ? ev.altKey : ev.ctrlKey) && (key === 'ArrowUp' || key === 'ArrowDown')) {
						const target = ev.target;
						const self = ev.currentTarget;

						const closest = target.closest(`[data-targets~=${inputId}]`) as
							| HTMLButtonElement
							| HTMLTextAreaElement;

						if (!closest) {
							return;
						}

						ev.preventDefault();

						const nodes = [
							...self.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>(`[data-targets~=${inputId}]`),
						];

						const pos = nodes.indexOf(closest);
						const delta = key === 'ArrowUp' ? -1 : 1;

						let nextPos = pos + delta;

						if (nextPos < 0 || nextPos > nodes.length - 1) {
							return;
						}

						const nextTarget = nodes[nextPos];
						if (nextTarget && !nextTarget.disabled) {
							nextTarget.focus();
						}
					}
				}}
				class="flex min-w-0 grow flex-col gap-2 overflow-y-auto pb-4"
			>
				{state.reply !== undefined && (
					<div>
						<div class="flex items-center justify-between gap-4 px-4 pt-4">
							<span class="overflow-hidden text-ellipsis whitespace-nowrap text-de font-medium">
								<span class="text-muted-fg">Replying to </span>
								<span class="text-primary/85">
									{(() => {
										const data = replying.data;
										if (data) {
											return data.author.displayName.value || '@' + data.author.handle.value;
										}

										return '...';
									})()}
								</span>
							</span>

							<button
								onClick={() => {
									state.reply = undefined;
								}}
								class={/* @once */ IconButton({ edge: 'right', class: '-my-1.5 text-primary/85' })}
							>
								<CloseIcon />
							</button>
						</div>

						{(() => {
							const data = replying.data;
							if (data) {
								return <DummyPost post={data} />;
							}

							const error = replying.error;
							return (
								<div class="flex min-w-0 gap-3 px-4 pt-3">
									<div class="flex shrink-0 flex-col items-center">
										<div class="h-10 w-10 rounded-full bg-muted"></div>
										<div class="-mb-4 mt-2 grow border-l-2 border-divider" />
									</div>

									{error ? (
										<div class="flex min-w-0 grow flex-col text-sm">
											<p class="">Failed to retrieve reply</p>
											<p class="text-muted-fg">{/* @once */ '' + error}</p>

											<div class="mt-3">
												<button class={/* @once */ Button({ variant: 'outline', size: 'xs' })}>
													Try again
												</button>
											</div>
										</div>
									) : (
										<div class="grid h-10 min-w-0 grow place-items-center">
											<CircularProgress />
										</div>
									)}
								</div>
							);
						})()}
					</div>
				)}

				<For each={posts}>
					{(draft, index) => {
						let textareaRef!: HTMLTextAreaElement;
						let fileInputRef!: HTMLInputElement;

						const [imageProcessing, setImageProcessing] = createSignal(0);

						const images = draft.images;
						const tags = draft.tags;

						const length = createMemo(() => getRtLength(draft.rt));

						const addImagesRaw = (imgs: Array<{ blob: Blob; ratio: { width: number; height: number } }>) => {
							batch(() => {
								for (let i = 0, ilen = imgs.length; i < ilen; i++) {
									const img = imgs[i];

									images.push({
										blob: img.blob,
										ratio: img.ratio,
										alt: signal(''),
									});
								}

								// External embeds can't be added alongside images
								draft.external = undefined;
							});

							textareaRef.focus();
						};

						const addImages = async (files: File[]) => {
							if (images.length + files.length > MAX_IMAGE_LIMIT) {
								setLog(logError(`A post can only have up to ${MAX_IMAGE_LIMIT} images`));
								return;
							}

							const pending: PendingImage[] = [];
							const next: Array<{ blob: Blob; ratio: { width: number; height: number } }> = [];

							let errored = false;

							setLog(logNone);
							setImageProcessing(imageProcessing() + 1);

							for (let idx = 0, len = files.length; idx < len; idx++) {
								const file = files[idx];

								if (!file.type.startsWith('image/')) {
									continue;
								}

								try {
									const compressed = await compressPostImage(file);

									const blob = compressed.blob;
									const before = compressed.before;
									const after = compressed.after;

									if (after.size !== before.size) {
										pending.push({ ...compressed, name: file.name });
									} else {
										next.push({ blob: blob, ratio: { width: after.width, height: after.height } });
									}
								} catch (err) {
									console.error(`Failed to compress image`, err);
									errored = true;
								}
							}

							batch(() => {
								setImageProcessing(imageProcessing() - 1);

								if (next.length > 0) {
									addImagesRaw(next);
								}

								if (pending.length > 0) {
									openModal(() => (
										<ImageCompressAlertDialog
											images={pending}
											onConfirm={() => {
												addImagesRaw(
													pending.map((img) => ({
														blob: img.blob,
														ratio: {
															width: img.after.width,
															height: img.after.height,
														},
													})),
												);
											}}
										/>
									));
								}

								if (errored) {
									setLog(logError(`Some of your images can't be added`));
								}
							});
						};

						createEffect(() => {
							if (untrack(index) === 0) {
								state.reply;
							}

							draft.external;
							draft.record;

							textareaRef.focus();
						});

						createEffect(() => {
							// Remove content warning if no images are present.
							if (images.length === 0) {
								draft.labels = [];
							}
						});

						return (
							<div class="flex pt-4">
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept="image/*"
									onChange={() => {
										const files = Array.from(fileInputRef.files!);

										fileInputRef.value = '';
										addImages(files);
									}}
									class="hidden"
								/>

								<div class="flex shrink-0 flex-col items-center px-4">
									<SwitchAccountAction value={context.author} onChange={(next) => (context.author = next)}>
										<button
											tabindex={index() === 0 ? 0 : -1}
											disabled={multiagent.accounts.length < 2}
											class="h-10 w-10 overflow-hidden rounded-full hover:opacity-80 disabled:pointer-events-none"
										>
											<img
												src={author()?.profile?.avatar || DefaultUserAvatar}
												title={`Currently posting as @${author()?.session.handle}`}
												class="h-full w-full"
											/>
										</button>
									</SwitchAccountAction>

									{index() + 1 < MAX_THREAD_LIMIT && (
										<div class="-mb-4 mt-2 grow border-l-2 border-divider" />
									)}
								</div>

								<div class="min-w-0 grow">
									{/* Post header */}
									{(() => {
										const $author = author();

										if ($author) {
											return (
												<div class="mb-0.5 flex items-center gap-1 pr-4 text-sm text-muted-fg">
													{$author.profile?.displayName && (
														<bdi class="overflow-hidden text-ellipsis whitespace-nowrap">
															<span class="font-bold text-primary">{$author.profile.displayName}</span>
														</bdi>
													)}

													<span class="overflow-hidden text-ellipsis whitespace-nowrap">
														{'@' + $author.session.handle}
													</span>

													<div class="grow"></div>

													{index() !== 0 && (
														<button
															onClick={() => {
																posts.splice(index(), 1);
															}}
															class={
																/* @once */ IconButton({ edge: 'right', class: '-my-1.5 text-primary/85' })
															}
														>
															<CloseIcon />
														</button>
													)}
												</div>
											);
										}
									})()}

									{/* Composer */}
									<RichtextComposer
										ref={(node) => {
											textareaRef = node;
											node.setAttribute('data-targets', inputId);
										}}
										type="post"
										uid={context.author}
										value={draft.text}
										rt={draft.rt}
										placeholder={
											index() === 0
												? !state.reply
													? "What's happening?"
													: 'Write your reply...'
												: 'Say more...'
										}
										minRows={2}
										onChange={(next) => {
											draft.text = next;
										}}
										onImageDrop={addImages}
										onSubmit={handleSubmitPrereq}
									/>

									{/* Tags */}
									<div class="mb-2 mr-4">
										<TagsInput tags={tags} limit={MAX_EXTERNAL_TAGS_LIMIT} />
									</div>

									{/* Images */}
									<div class="mb-2 mr-4 flex flex-wrap gap-3 empty:hidden">
										<For each={images}>
											{(image, index) => (
												<div class="relative">
													<BlobImage src={image.blob} class="h-32 w-32 rounded-md object-cover" />

													<button
														title="Remove this image"
														onClick={() => {
															images.splice(index(), 1);

															if (images.length === 0) {
																textareaRef!.focus();
															}
														}}
														class={removeImageBtn}
													>
														<CloseIcon class="drop-shadow" />
													</button>

													<button
														title="Add image description"
														onClick={() => {
															openModal(() => <ImageAltDialog image={image} />, {
																disableBackdropClose: true,
															});
														}}
														class={
															/* @once */ Interactive({
																variant: 'white',
																class: `absolute bottom-0 left-0 m-1 flex h-5 items-center rounded bg-black/50 px-1 text-xs font-medium text-white backdrop-blur`,
															})
														}
													>
														<span class="drop-shadow">ALT</span>
														{image.alt.value && <CheckIcon class="ml-1" />}
													</button>
												</div>
											)}
										</For>
									</div>

									{/* External links */}
									<Show when={draft.external}>
										{(url) => (
											<div class="relative mb-2 mr-4 empty:hidden">
												<button
													title="Remove link embed"
													onClick={() => {
														draft.external = undefined;
													}}
													class={`${removeEmbedBtn} m-px`}
												>
													<CloseIcon />
												</button>

												<EmbedExternal url={url()} />
											</div>
										)}
									</Show>

									{/* Records */}
									<Show when={draft.record}>
										{(uri) => (
											<div class="relative mb-2 mr-4 empty:hidden">
												<button
													title="Remove embed"
													onClick={() => {
														draft.record = undefined;
													}}
													class={`${removeEmbedBtn} m-px`}
												>
													<CloseIcon />
												</button>

												<EmbedRecord uid={context.author} uri={uri()} />
											</div>
										)}
									</Show>

									{/* Add links */}
									<div class="mb-2 mr-4 flex flex-col gap-3 empty:hidden">
										<For
											each={
												draft.images.length < 1 && !draft.external && !draft.record
													? draft.rt.links
													: undefined
											}
										>
											{(link) => {
												const [pending, setPending] = createSignal(false);

												return (
													<button
														title={`Add link card: ${link}`}
														disabled={pending()}
														onClick={async () => {
															const record = extractAppLink(link);

															if (record) {
																const { type, author, rkey } = record;

																let did: DID;
																if (isDid(author)) {
																	did = author;
																} else {
																	setPending(true);

																	const result = await queryClient.fetchQuery({
																		queryKey: getResolvedHandleKey(context.author, author),
																		queryFn: getResolvedHandle,
																	});

																	did = result.did;
																}

																draft.record = `at://${did}/${type}/${rkey}`;
															} else {
																draft.external = link;
															}
														}}
														class={`${linkEmbedBtn} group`}
													>
														<LinkIcon class="shrink-0 text-base text-muted-fg" />

														<span class="overflow-hidden text-ellipsis whitespace-nowrap text-accent group-disabled:opacity-50">
															{link}
														</span>

														{(() => {
															if (pending()) {
																return (
																	<div class="shrink-0">
																		<CircularProgress size={16} />
																	</div>
																);
															}
														})()}
													</button>
												);
											}}
										</For>
									</div>

									{/* Toolbar */}
									<div class="-ml-2.5 mr-3 flex flex-wrap items-center justify-end">
										{imageProcessing() > 0 ? (
											<div class="flex h-9 w-9 items-center justify-center">
												<CircularProgress size={16} />
											</div>
										) : (
											<button
												title="Attach image..."
												disabled={images.length >= MAX_IMAGE_LIMIT}
												onClick={() => fileInputRef.click()}
												class={toolbarIcon}
											>
												<ImageIcon />
											</button>
										)}

										<EmojiFlyout
											multiple
											onPick={(emoji, single) => {
												if (single) {
													setTimeout(() => {
														textareaRef!.focus();
														document.execCommand('insertText', false, emoji.picked);
													}, 0);
												} else {
													// We can't use insertText here, this breaks undo/redo history
													textareaRef!.setRangeText(emoji.picked);
													textareaRef!.dispatchEvent(
														new Event('input', { bubbles: true, cancelable: false }),
													);
												}
											}}
										>
											<button title="Insert emojis..." class={toolbarIcon}>
												<EmojiEmotionsIcon />
											</button>
										</EmojiFlyout>

										<div class="grow px-2"></div>

										<span
											class={clsx([
												`px-2 text-de text-muted-fg`,
												length() > GRAPHEME_LIMIT && `text-red-600`,
											])}
										>
											{GRAPHEME_LIMIT - length()}
										</span>

										{images.length > 0 && (
											<ContentWarningAction labels={draft.labels}>
												<button title="Add content warning..." class={toolbarIcon}>
													<ShieldIcon class={clsx([draft.labels.length > 0 && `text-accent`])} />
												</button>
											</ContentWarningAction>
										)}

										{index() === 0 && !state.reply && (
											<ThreadgateAction state={state.gate} onChange={(next) => (state.gate = next)}>
												<button title={renderGateAlt(state.gate)} class={toolbarIcon}>
													{renderGateIcon(state.gate)}
												</button>
											</ThreadgateAction>
										)}

										<PostLanguageAction languages={draft.languages}>
											<button
												class={
													/* @once */ Interactive({
														class: `flex h-9 min-w-0 items-center rounded-md px-2 text-sm text-primary/85 hover:text-primary`,
													})
												}
											>
												{(() => {
													const languages = draft.languages;

													if (languages.length > 0) {
														return (
															<span class="contents">
																<span class="overflow-hidden text-ellipsis whitespace-nowrap">
																	{
																		/* @once */ languages.length > 1
																			? languages.map((code) => languageNames.of(code)).join(', ')
																			: languageNames.of(languages[0])
																	}
																</span>
																<ArrowDropDownIcon class="-mr-1.5 shrink-0 text-lg" />
															</span>
														);
													} else {
														return <LanguageIcon aria-label="Add post language..." class="mx-px text-lg" />;
													}
												})()}
											</button>
										</PostLanguageAction>
									</div>
								</div>
							</div>
						);
					}}
				</For>

				{posts.length < MAX_THREAD_LIMIT && (
					<div class="relative flex items-center px-4 pt-2">
						<div class="w-10"></div>

						<button
							disabled={(() => {
								const last = posts[posts.length - 1];
								return !last.external && last.images.length === 0 && last.text.trim().length === 0;
							})()}
							onClick={() => {
								posts.push(createPostState(preferences));
							}}
							class={/* @once */ Button({ variant: 'ghost', class: 'text-primary/85' })}
							data-targets={inputId}
						>
							{/* Add some affordances to people attempting to click the plus button */}
							<div class="absolute left-4 grid h-9 w-10 place-items-center">
								{/* Icon shouldn't be affected by hover:text-white */}
								<AddIcon class="text-xl text-primary/85" />
							</div>
							<span class="text-de">Add to thread</span>
						</button>
					</div>
				)}
			</fieldset>
		</div>
	);
};

export default ComposerPane;

const EmbedExternal = (props: { url: string }) => {
	const external = createQuery(() => {
		return {
			queryKey: getLinkMetaKey(props.url),
			queryFn: getLinkMeta,
		};
	});

	return (() => {
		const data = external.data;
		if (data) {
			return <EmbedLinkContent link={data} />;
		}

		const error = external.error;
		if (error) {
			return (
				<div class="rounded-md border border-divider p-3 text-sm">
					<p class="font-bold">Error adding link card</p>
					<p class="text-de text-muted-fg">{/* @once */ '' + error}</p>
				</div>
			);
		}

		return (
			<div class="grid place-items-center rounded-md border border-divider p-4">
				<CircularProgress />
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedRecord = (props: { uid: DID; uri: string }) => {
	const opts = createMemo(() => {
		const uid = props.uid;
		const uri = props.uri;

		const ns = getCollectionId(uri);

		if (ns === 'app.bsky.feed.post') {
			const key = getPostKey(uid, uri);

			return {
				type: ns,
				query: createQuery(() => {
					return {
						queryKey: key,
						queryFn: getPost,
						initialDataUpdatedAt: 0,
						initialData: () => getInitialPost(key),
					};
				}),
			} as const;
		}

		if (ns === 'app.bsky.feed.generator') {
			const key = getFeedInfoKey(uid, uri);

			return {
				type: ns,
				query: createQuery(() => {
					return {
						queryKey: key,
						queryFn: getFeedInfo,
						initialDataUpdatedAt: 0,
						initialData: () => getInitialFeedInfo(key),
					};
				}),
			} as const;
		}

		if (ns === 'app.bsky.graph.list') {
			const key = getListInfoKey(uid, uri);

			return {
				type: ns,
				query: createQuery(() => {
					return {
						queryKey: key,
						queryFn: getListInfo,
						initialDataUpdatedAt: 0,
						initialData: () => getInitialListInfo(key),
					};
				}),
			} as const;
		}

		throw new Error(`unknown ns: ${ns}`);
	});

	return (() => {
		const { type, query } = opts();

		// It doesn't like it if we extract query.data
		if (query.data) {
			if (type === 'app.bsky.feed.post') {
				const data = query.data;

				const author = data.author;
				const record = data.record;

				return (
					<EmbedQuoteContent
						record={{
							// @ts-expect-error
							author: {
								avatar: author.avatar.value,
								handle: author.handle.value,
								displayName: author.displayName.value,
							},
							embeds: data.embed.value ? [data.embed.value!] : [],
							value: {
								createdAt: record.value.createdAt,
								text: record.value.text,
							},
						}}
						mod={null}
					/>
				);
			}

			if (type === 'app.bsky.feed.generator') {
				const data = query.data;

				const creator = data.creator;

				return (
					<EmbedFeedContent
						feed={{
							// @ts-expect-error
							creator: {
								handle: creator.handle.value,
							},
							avatar: data.avatar.value,
							displayName: data.name.value,
						}}
					/>
				);
			}

			if (type === 'app.bsky.graph.list') {
				const data = query.data;

				const creator = data.creator;

				return (
					<EmbedListContent
						list={{
							// @ts-expect-error
							creator: {
								handle: creator.handle.value,
							},
							avatar: data.avatar.value,
							purpose: data.purpose.value,
							name: data.name.value,
						}}
					/>
				);
			}

			return null;
		}

		const error = query.error;
		if (error) {
			return (
				<div class="rounded-md border border-divider p-3 text-sm">
					<p class="font-bold">Error adding embed</p>
					<p class="text-de text-muted-fg">{/* @once */ '' + error}</p>
				</div>
			);
		}

		return (
			<div class="grid place-items-center rounded-md border border-divider p-4">
				<CircularProgress />
			</div>
		);
	}) as unknown as JSX.Element;
};
