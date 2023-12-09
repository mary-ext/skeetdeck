import { type JSX, For, batch, createMemo, createSignal } from 'solid-js';

import { type CreateQueryResult, createQuery, useQueryClient } from '@pkg/solid-query';

import type { DID, Records, RefOf, UnionOf } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { systemLanguages } from '~/api/globals/platform.ts';

import type { ThreadPage } from '~/api/models/thread.ts';
import { getUploadedBlob, uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info.ts';
import { getLinkMeta, getLinkMetaKey } from '~/api/queries/get-link-meta.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list-info.ts';
import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';
import { getResolvedHandle, getResolvedHandleKey } from '~/api/queries/get-resolved-handle.ts';
import type { SignalizedFeed } from '~/api/stores/feeds.ts';
import type { SignalizedList } from '~/api/stores/lists.ts';
import { SignalizedPost } from '~/api/stores/posts.ts';

import { finalizeRt, getRtLength, textToPrelimRt } from '~/api/richtext/composer.ts';
import type { Facet } from '~/api/richtext/types.ts';

import { BSKY_FEED_URL_RE, BSKY_LIST_URL_RE, BSKY_POST_URL_RE } from '~/api/utils/links.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';
import { getCollectionId, getCurrentDate, isDid } from '~/api/utils/misc.ts';

import { type ComposedImage, type PendingImage, compressPostImage } from '~/utils/image.ts';
import { produce } from '~/utils/immer.ts';
import { signal } from '~/utils/signals.ts';
import { languageNames } from '~/utils/intl/display-names.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { preferences } from '../../globals/settings.ts';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import ImageCompressAlertDialog from '~/com/components/dialogs/ImageCompressAlertDialog.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';

import { EmbedFeedContent } from '~/com/components/embeds/EmbedFeed.tsx';
import { EmbedLinkContent } from '~/com/components/embeds/EmbedLink.tsx';
import { EmbedListContent } from '~/com/components/embeds/EmbedList.tsx';
import { EmbedRecordContent } from '~/com/components/embeds/EmbedRecord.tsx';

import EmojiFlyout from '~/com/components/emojis/EmojiFlyout.tsx';
import RichtextComposer from '~/com/components/richtext/RichtextComposer.tsx';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import CheckIcon from '~/com/icons/baseline-check.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';
import EmojiEmotionsIcon from '~/com/icons/baseline-emoji-emotions.tsx';
import ImageIcon from '~/com/icons/baseline-image.tsx';
import LanguageIcon from '~/com/icons/baseline-language.tsx';
import LinkIcon from '~/com/icons/baseline-link.tsx';
// import PublicIcon from '~/com/icons/baseline-public.tsx';
import ShieldIcon from '~/com/icons/baseline-shield.tsx';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import SwitchAccountAction from '../flyouts/SwitchAccountAction.tsx';

import { useComposer } from './ComposerContext.tsx';
import DummyPost from './DummyPost.tsx';
import TagsInput from './TagInput.tsx';
import ContentWarningAction from './actions/ContentWarningAction.tsx';
import PostLanguageAction from './actions/PostLanguageAction.tsx';
import type { getTimelineLatestKey } from '~/api/queries/get-timeline.ts';

type PostRecord = Records['app.bsky.feed.post'];
type StrongRef = RefOf<'com.atproto.repo.strongRef'>;

type PostRecordEmbed = UnionOf<'app.bsky.embed.record'>;

const GRAPHEME_LIMIT = 300;
const MAX_IMAGE_LIMIT = 4;
const MAX_EXTERNAL_TAGS_LIMIT = 8;

const enum PostState {
	IDLE,
	ERRORED,
	DISPATCHING,
	SENT,
}

interface BaseEmbedding<T, D> {
	type: T;
	uri: string;
	query: CreateQueryResult<D | undefined>;
}

const enum EmbeddingType {
	QUOTE,
	FEED,
	LIST,
}

type Embedding =
	| BaseEmbedding<EmbeddingType.QUOTE, SignalizedPost>
	| BaseEmbedding<EmbeddingType.FEED, SignalizedFeed>
	| BaseEmbedding<EmbeddingType.LIST, SignalizedList>;

const getLanguages = (): string[] => {
	const prefs = preferences.language;
	const lang = prefs.defaultPostLanguage;

	if (lang === 'none') {
		return [];
	}
	if (lang === 'system') {
		return [systemLanguages[0]];
	}

	return [lang];
};

const removeEmbedBtn = Interactive({
	variant: 'none',
	class: `absolute right-1 top-1 z-20 grid h-7 w-7 place-items-center rounded-full bg-black text-base text-white hover:bg-secondary`,
});

const linkEmbedBtn = Interactive({
	class: `flex items-center gap-3 rounded-md border border-divider px-3 py-2.5 text-left text-sm`,
});

const ComposerPane = () => {
	let fileInputRef: HTMLInputElement | undefined;
	let textareaRef: HTMLTextAreaElement | undefined;

	const queryClient = useQueryClient();
	const context = useComposer();

	const author = createMemo(() => multiagent.accounts.find((acc) => acc.did === context.authorDid)!);

	const [status, setStatus] = createSignal<string>();
	const [message, setMessage] = createSignal<string>();
	const [state, setState] = createSignal(PostState.IDLE);

	const [text, setText] = createSignal('');
	const prelimRt = createMemo(() => textToPrelimRt(text()));

	const [imageProcessing, setImageProcessing] = createSignal(0);
	const [images, setImages] = createSignal<ComposedImage[]>([]);

	const [linkUrl, setLinkUrl] = createSignal<string>();

	const [tags, setTags] = createSignal<string[]>([]);
	const [labels, setLabels] = createSignal<string[]>([]);
	const [languages, setLanguages] = createSignal(getLanguages());

	const links = createMemo(() => prelimRt()?.links, undefined, {
		equals: (a, b) => {
			if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
				for (let idx = a.length - 1; idx >= 0; idx--) {
					if (a[idx] !== b[idx]) {
						return false;
					}
				}

				return true;
			}

			return a === b;
		},
	});

	const reply = createQuery(() => {
		const $replyUri = context.replyUri;
		const key = getPostKey(context.authorDid, $replyUri!);

		return {
			enabled: !!$replyUri,
			queryKey: key,
			queryFn: getPost,
			initialData: () => getInitialPost(key),
		};
	});

	const external = createQuery(() => {
		const $linkUrl = linkUrl();

		return {
			enabled: $linkUrl !== undefined,
			queryKey: getLinkMetaKey($linkUrl!),
			queryFn: getLinkMeta,
		};
	});

	const embedding = createMemo((): Embedding | null => {
		const uri = context.recordUri;

		if (uri) {
			const collection = getCollectionId(uri);

			if (collection === 'app.bsky.feed.post') {
				const quote = createQuery(() => {
					const key = getPostKey(context.authorDid, uri);

					return {
						queryKey: key,
						queryFn: getPost,
						initialData: () => getInitialPost(key),
					};
				});

				return {
					type: EmbeddingType.QUOTE,
					uri: uri,
					query: quote,
				};
			}

			if (collection === 'app.bsky.feed.generator') {
				const feed = createQuery(() => {
					const key = getFeedInfoKey(context.authorDid, uri);

					return {
						queryKey: key,
						queryFn: getFeedInfo,
						initialData: () => getInitialFeedInfo(key),
					};
				});

				return {
					type: EmbeddingType.FEED,
					uri: uri,
					query: feed,
				};
			}

			if (collection === 'app.bsky.graph.list') {
				const list = createQuery(() => {
					const key = getListInfoKey(context.authorDid, uri);

					return {
						queryKey: key,
						queryFn: getListInfo,
						initialData: () => getInitialListInfo(key),
					};
				});

				return {
					type: EmbeddingType.LIST,
					uri: uri,
					query: list,
				};
			}
		}

		return null;
	});

	const length = createMemo(() => {
		const rt = prelimRt();
		return getRtLength(rt);
	});

	const isEnabled = () => {
		const $state = state();
		const $length = length();

		const $images = images();
		const $embedding = embedding();

		return (
			$state < PostState.DISPATCHING &&
			(($length > 0 && $length <= 300) || $images.length > 0) &&
			!reply.isLoading &&
			!external.isLoading &&
			(!$embedding || !$embedding.query.isLoading)
		);
	};

	const handleSubmit = async () => {
		if (!isEnabled()) {
			return;
		}

		setState(PostState.DISPATCHING);

		const $authorDid = context.authorDid;

		const rt = prelimRt();

		const $reply = reply.data;
		const $external = external.data;
		const $embedding = embedding();
		const $images = images();
		const $tags = tags();

		const $languages = languages();
		const $labels = labels();

		let replyTo: PostRecord['reply'];
		let embedded: PostRecord['embed'];

		if ($reply) {
			const ref: StrongRef = {
				cid: $reply.cid.value,
				uri: $reply.uri,
			};

			const rec = $reply.record.value;
			const recReplyRef = rec.reply;

			replyTo = {
				root: recReplyRef?.root || ref,
				parent: ref,
			};
		}

		// Resolve images
		if ($images.length > 0) {
			for (let idx = 0, len = $images.length; idx < len; idx++) {
				const img = $images[idx];
				const blob = img.blob;

				if (getUploadedBlob($authorDid, blob)) {
					continue;
				}

				setStatus(`Uploading image #${idx + 1}`);

				try {
					await uploadBlob($authorDid, blob);
				} catch (err) {
					console.error(`Failed to upload image`, err);

					setMessage(`Failed to upload image #${idx + 1}`);
					setStatus(``);

					setState(PostState.ERRORED);
					return;
				}
			}

			embedded = {
				$type: 'app.bsky.embed.images',
				images: $images.map((img) => ({
					image: getUploadedBlob($authorDid, img.blob)!,
					alt: img.alt.value,
					aspectRatio: img.ratio,
				})),
			};
		}

		// Resolve external links
		if ($external) {
			if ($external.thumb && !getUploadedBlob($authorDid, $external.thumb)) {
				setStatus(`Uploading link thumbnail`);

				try {
					await uploadBlob($authorDid, $external.thumb);
				} catch (err) {
					console.error(`Failed to upload image`, err);

					setMessage(`Failed to upload link thumbnail`);
					setStatus(``);

					setState(PostState.ERRORED);
					return;
				}
			}

			embedded = {
				$type: 'app.bsky.embed.external',
				external: {
					uri: $external.uri,
					title: $external.title,
					description: $external.description,
					thumb: $external.thumb && getUploadedBlob($authorDid, $external.thumb),
				},
			};
		}

		// Resolve embeds
		if ($embedding && $embedding.query.data) {
			const thing = $embedding.query.data;

			const rec: PostRecordEmbed = {
				$type: 'app.bsky.embed.record',
				record: {
					cid: thing.cid.value,
					uri: thing.uri,
				},
			};

			if (
				embedded &&
				(embedded.$type === 'app.bsky.embed.images' || embedded.$type === 'app.bsky.embed.external')
			) {
				embedded = {
					$type: 'app.bsky.embed.recordWithMedia',
					media: embedded,
					record: rec,
				};
			} else {
				embedded = rec;
			}
		}

		let text: string;
		let facets: Facet[];

		// Resolve the facets
		{
			setStatus(`Resolving facets`);

			try {
				({ text, facets } = (rt as any).c ||= await finalizeRt($authorDid, rt));
			} catch (err) {
				console.error(`Failed to resolve facets`, err);

				setMessage(`Failed to resolve facets`);
				setStatus(``);

				setState(PostState.ERRORED);
				return;
			}
		}

		// Create the record
		const rkey = getCurrentTid();

		{
			setStatus(`Sending post`);

			const record: PostRecord = {
				createdAt: getCurrentDate(),
				text: text,
				facets: facets,
				tags: $tags.length > 0 ? $tags : undefined,
				reply: replyTo,
				embed: embedded,
				langs: $languages.length > 0 ? $languages : undefined,
				labels:
					$labels.length > 0
						? { $type: 'com.atproto.label.defs#selfLabels', values: $labels.map((value) => ({ val: value })) }
						: undefined,
			};

			const writes: UnionOf<'com.atproto.repo.applyWrites#create'>[] = [
				{
					$type: 'com.atproto.repo.applyWrites#create',
					collection: 'app.bsky.feed.post',
					rkey: rkey,
					value: record,
				},
			];

			try {
				const agent = await multiagent.connect($authorDid);

				await agent.rpc.call('com.atproto.repo.applyWrites', {
					data: {
						repo: $authorDid,
						writes: writes,
					},
				});

				setState(PostState.SENT);
			} catch (err) {
				console.error(`Failed to post`, err);

				setMessage(`Failed to post`);
				setStatus(``);

				setState(PostState.ERRORED);
				return;
			}
		}

		// Let's do the fun mutation and invalidation stuff!
		try {
			// 1. If it's attached as a reply, let's retrieve the postViews
			if ($reply) {
				const rootUri = replyTo!.root.uri;
				const parentUri = $reply.uri;

				// We don't actually need the parent view here, that's just for updating
				// the reply count properly.
				const [postView] = await Promise.allSettled([
					queryClient.fetchQuery({
						queryKey: getPostKey($authorDid, `at://${$authorDid}/app.bsky.feed.post/${rkey}`),
						queryFn: getPost,
					}),
					queryClient.fetchQuery({
						queryKey: getPostKey($authorDid, parentUri),
						queryFn: getPost,
						staleTime: 0,
					}),
				]);

				if (postView.status === 'fulfilled') {
					const post = postView.value;

					// 1.1. Go through every single getPostThread queries

					// - We should only do this for $authorDid's getPostThread specifically.
					// - We can skip posts where the root reply URI doesn't match

					const updatePostThread = produce((data: ThreadPage) => {
						const descendants = data.descendants;

						if (data.post.uri === parentUri) {
							descendants.unshift({ items: [post] });
							return;
						}

						for (let i = 0, ilen = descendants.length; i < ilen; i++) {
							const slice = descendants[i];
							const items = slice.items;

							// UI always has actualDepth + 1 for the height,
							// so let's use that as our assumption.
							if (items.length > data.depth - 1) {
								continue;
							}

							for (let j = 0, jlen = items.length; j < jlen; j++) {
								const item = items[j];

								// It's only at the end, but let's do this to make TS happy.
								if (!(item instanceof SignalizedPost)) {
									break;
								}

								// We found the post, break out of the loop entirely.
								if (item.uri === parentUri) {
									items.splice(j + 1, jlen, post);
									return;
								}
							}
						}
					});

					queryClient.setQueriesData<ThreadPage>(
						{
							queryKey: ['getPostThread', $authorDid],
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

			// 2. Invalidate all getTimelineLatest queries
			// This one is done last, because *maybe* by the time the above fetch
			// finishes, we'll get an accurate view over the timeline
			queryClient.invalidateQueries({
				queryKey: ['getTimelineLatest'],
				predicate: (query) => {
					const [, , params] = query.queryKey as ReturnType<typeof getTimelineLatestKey>;
					return params.type !== 'profile' || params.actor === $authorDid;
				},
			});
		} catch {}

		// We're finished, let's wrap it up by resetting the entire state
		batch(() => {
			context.reset++;
			context.recordUri = undefined;
			context.replyUri = undefined;
		});
	};

	const addImagesRaw = (imgs: Array<{ blob: Blob; ratio: { width: number; height: number } }>) => {
		const next: ComposedImage[] = [];

		for (let idx = 0, len = imgs.length; idx < len; idx++) {
			const img = imgs[idx];

			next.push({
				blob: img.blob,
				ratio: img.ratio,
				alt: signal(''),
				record: undefined,
			});
		}

		setLinkUrl(undefined);
		setImages(images().concat(next));

		textareaRef!.focus();
	};

	const addImages = async (files: File[]) => {
		if (images().length + files.length > MAX_IMAGE_LIMIT) {
			setMessage(`A post can only have up to ${MAX_IMAGE_LIMIT} images`);
			return;
		}

		const pending: PendingImage[] = [];
		const next: Array<{ blob: Blob; ratio: { width: number; height: number } }> = [];
		let errored = false;

		setMessage('');
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
			addImagesRaw(next);

			if (pending.length > 0) {
				openModal(() => (
					<ImageCompressAlertDialog
						images={pending}
						onConfirm={() =>
							addImagesRaw(
								pending.map((img) => ({
									blob: img.blob,
									ratio: {
										width: img.after.width,
										height: img.after.height,
									},
								})),
							)
						}
					/>
				));
			}

			if (errored) {
				setMessage(`Some of your images can't be added`);
			}
		});
	};

	const handleFileInput = async (ev: Event) => {
		const target = ev.currentTarget as HTMLInputElement;
		const files = Array.from(target.files!);

		target.value = '';

		addImages(files);
	};

	return (
		<div class="flex w-96 shrink-0 flex-col border-r border-divider">
			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept="image/*"
				onChange={handleFileInput}
				class="hidden"
			/>

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

				<span
					class="text-de empty:hidden"
					classList={{
						[`text-muted-fg`]: state() === PostState.DISPATCHING,
						[`text-red-500`]: state() === PostState.ERRORED,
					}}
				>
					{status()}
				</span>

				{state() === PostState.DISPATCHING ? (
					<div class="pl-2">
						<CircularProgress />
					</div>
				) : (
					<button
						disabled={!isEnabled()}
						onClick={handleSubmit}
						class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
					>
						Post
					</button>
				)}
			</div>

			<fieldset disabled={state() >= PostState.DISPATCHING} class="min-w-0 grow overflow-y-auto">
				{/* Replies */}
				{(() => {
					if (context.replyUri) {
						return (
							<div class="flex items-center justify-between gap-4 px-4 pt-3">
								<span class="text-de font-bold text-muted-fg">Replying to</span>

								<button
									onClick={() => {
										context.replyUri = undefined;
									}}
									class={/* @once */ IconButton({ edge: 'right', color: 'muted', class: '-mb-2 -mt-1' })}
								>
									<CloseIcon />
								</button>
							</div>
						);
					}
				})()}

				{(() => {
					if (reply.data) {
						return <DummyPost post={/* @once */ reply.data} />;
					}

					if (reply.isFetching) {
						return (
							<div class="flex h-13 items-center justify-center border-divider">
								<CircularProgress />
							</div>
						);
					}
				})()}

				{/* Composer */}
				<div class="flex pb-4">
					<div class="shrink-0 p-4">
						<SwitchAccountAction value={context.authorDid} onChange={(next) => (context.authorDid = next)}>
							<button
								disabled={multiagent.accounts.length < 2}
								class="h-10 w-10 overflow-hidden rounded-full hover:opacity-80 disabled:pointer-events-none"
							>
								<img src={author().profile?.avatar || DefaultUserAvatar} class="h-full w-full" />
							</button>
						</SwitchAccountAction>
					</div>

					<div class="min-w-0 grow">
						{/* Rich text editor */}
						<RichtextComposer
							ref={textareaRef}
							uid={context.authorDid}
							value={text()}
							rt={prelimRt()}
							placeholder="What's happening?"
							minRows={4}
							onChange={setText}
							onSubmit={handleSubmit}
							onImageDrop={addImages}
						/>

						{/* Tags */}
						<div class="mb-3 mr-3">
							<TagsInput tags={tags()} limit={MAX_EXTERNAL_TAGS_LIMIT} onChange={setTags} />
						</div>

						{/* Message */}
						<div class="mb-4 mr-3 rounded-md bg-secondary/30 px-4 py-2 text-sm empty:hidden">{message()}</div>

						{/* Record embeds */}
						<div class="relative mb-3 mr-3 flex flex-col empty:hidden">
							{(() => {
								const $embedding = embedding();

								if (!$embedding) {
									return;
								}

								const type = $embedding.type;
								const query = $embedding.query;

								return [
									<button
										title="Remove embed"
										onClick={() => {
											textareaRef!.focus();
											context.recordUri = undefined;
										}}
										class={`${removeEmbedBtn} m-px`}
									>
										<CloseIcon />
									</button>,

									() => {
										if (query.data) {
											if (type === EmbeddingType.QUOTE) {
												const data = query.data as SignalizedPost;

												const author = data.author;
												const record = data.record;

												return (
													<EmbedRecordContent
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

											if (type === EmbeddingType.FEED) {
												const data = query.data as SignalizedFeed;

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

											if (type === EmbeddingType.LIST) {
												const data = query.data as SignalizedList;

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
										}

										if (query.isFetching) {
											return (
												<div class="grid place-items-center rounded-md border border-divider p-4">
													<CircularProgress />
												</div>
											);
										}
									},
								] as unknown as JSX.Element;
							})()}
						</div>

						{/* Images */}
						<div class="flex flex-wrap gap-3 pb-4 pr-3 empty:hidden">
							<For each={images()}>
								{(image, index) => (
									<div class="relative">
										<BlobImage src={image.blob} class="h-32 w-32 rounded-md object-cover" />

										<button
											title="Remove this image"
											onClick={() => {
												const next = images().slice();
												next.splice(index(), 1);

												if (next.length === 0) {
													textareaRef!.focus();

													setLabels([]);
												}

												setImages(next);
											}}
											class={removeEmbedBtn}
										>
											<CloseIcon />
										</button>

										<button
											title="Add image description"
											onClick={() => {}}
											class="absolute bottom-0 left-0 m-1 flex h-5 items-center rounded bg-black/70 px-1 text-xs font-medium text-white"
										>
											<span>ALT</span>
											{image.alt.value && <CheckIcon class="ml-1" />}
										</button>
									</div>
								)}
							</For>
						</div>

						{/* Link card */}
						<div class="relative mb-3 mr-3 empty:hidden">
							{(() => {
								if (linkUrl()) {
									return (
										<button
											title="Remove link embed"
											onClick={() => {
												textareaRef!.focus();
												setLinkUrl(undefined);
											}}
											class={`${removeEmbedBtn} m-px`}
										>
											<CloseIcon />
										</button>
									);
								}
							})()}

							{(() => {
								if (external.data) {
									return <EmbedLinkContent link={/* @once */ external.data} />;
								}

								if (external.error) {
									return (
										<div class="rounded-md border border-divider p-3 text-sm">
											<p class="font-bold">Error adding link card</p>
											<p class="text-de text-muted-fg">{/* @once */ '' + external.error.message}</p>
										</div>
									);
								}

								if (external.isFetching) {
									return (
										<div class="grid place-items-center rounded-md border border-divider p-4">
											<CircularProgress />
										</div>
									);
								}
							})()}
						</div>

						{/* Add link card */}
						<div class="mb-3 mr-3 flex flex-col gap-3 empty:hidden">
							<For each={!embedding() && !linkUrl() ? links() : undefined}>
								{(link) => {
									const [pending, setPending] = createSignal(false);
									const record = matchExternalToRecord(link);

									return (
										<button
											title={`Add link card: ${link}`}
											disabled={pending()}
											onClick={async () => {
												if (record) {
													const { a, c, r } = record;

													let did: DID;
													if (isDid(a)) {
														did = a;
													} else {
														setPending(true);

														const result = await queryClient.fetchQuery({
															queryKey: getResolvedHandleKey(context.authorDid, a),
															queryFn: getResolvedHandle,
														});

														did = result.did;
													}

													context.recordUri = `at://${did}/${c}/${r}`;
												} else {
													setLinkUrl(link);
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
						<div class="mr-3 flex flex-wrap items-center justify-end border-t border-divider pt-3">
							{imageProcessing() > 0 ? (
								<div class="flex h-9 w-9 items-center justify-center">
									<CircularProgress />
								</div>
							) : (
								<button
									title="Attach image..."
									disabled={images().length >= MAX_IMAGE_LIMIT}
									onClick={() => fileInputRef!.click()}
									class={/* @once */ IconButton({ size: 'lg' })}
								>
									<ImageIcon />
								</button>
							)}

							{images().length >= 1 && (
								<ContentWarningAction labels={labels()} onChange={setLabels}>
									<button title="Add content warning..." class={/* @once */ IconButton({ size: 'lg' })}>
										<ShieldIcon classList={{ [`text-accent`]: labels().length > 0 }} />
									</button>
								</ContentWarningAction>
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
										textareaRef!.dispatchEvent(new Event('input', { bubbles: true, cancelable: false }));
									}
								}}
							>
								<button title="Insert emojis..." class={/* @once */ IconButton({ size: 'lg' })}>
									<EmojiEmotionsIcon />
								</button>
							</EmojiFlyout>

							{/* {!context.replyUri && (
								<button
									title="Everyone can reply to your post.\nClick here to change..."
									class={IconButton({ size: 'lg' })}
								>
									<PublicIcon />
								</button>
							)} */}

							<div class="grow px-2"></div>

							<span
								class="px-2 text-de text-muted-fg"
								classList={{ 'text-red-600': length() > GRAPHEME_LIMIT }}
							>
								{GRAPHEME_LIMIT - length()}
							</span>

							<PostLanguageAction languages={languages()} onChange={setLanguages}>
								<button
									class={
										/* @once */ Interactive({
											class: `flex h-9 min-w-0 items-center rounded-md px-2 text-sm`,
										})
									}
								>
									{(() => {
										const $languages = languages();

										if ($languages.length > 0) {
											return (
												<span class="contents">
													<span class="overflow-hidden text-ellipsis whitespace-nowrap">
														{
															/* @once */ $languages.length > 1
																? $languages.map((code) => languageNames.of(code)).join(', ')
																: languageNames.of($languages[0])
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
			</fieldset>
		</div>
	);
};

export default ComposerPane;

const matchExternalToRecord = (uri: string) => {
	let url: URL;
	let match: RegExpMatchArray | null;

	try {
		url = new URL(uri);
	} catch {
		return null;
	}

	const host = url.hostname;
	const path = url.pathname;

	if (host === 'bsky.app') {
		if ((match = BSKY_POST_URL_RE.exec(path))) {
			return { a: match[1], c: 'app.bsky.feed.post', r: match[2] };
		}

		if ((match = BSKY_FEED_URL_RE.exec(path))) {
			return { a: match[1], c: 'app.bsky.feed.generator', r: match[2] };
		}

		if ((match = BSKY_LIST_URL_RE.exec(path))) {
			return { a: match[1], c: 'app.bsky.graph.list', r: match[2] };
		}
	}

	return null;
};
