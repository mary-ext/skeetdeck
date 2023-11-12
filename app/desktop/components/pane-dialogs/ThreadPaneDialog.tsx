import { For, Match, Show, Switch, createMemo, onMount } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getInitialPostThread, getPostThread, getPostThreadKey } from '~/api/queries/get-post-thread.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import Post from '~/com/components/items/Post.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';
import { Link, LinkingType } from '~/com/components/Link.tsx';
import PermalinkPost from '~/com/components/PermalinkPost.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';
import iconButton from '~/com/primitives/icon-button.ts';

import { usePaneContext, usePaneModalState } from '~/desktop/components/panes/PaneContext.tsx';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';

export interface ThreadPaneDialogProps {
	/** Expected to be static */
	actor: DID;
	/** Expected to be static */
	rkey: string;
}

const MAX_ANCESTORS = 10;
const MAX_DESCENDANTS = 4;

const ThreadPaneDialog = (props: ThreadPaneDialogProps) => {
	const { actor, rkey } = props;

	const { pane } = usePaneContext();
	const modal = usePaneModalState();

	const thread = createQuery(() => {
		const key = getPostThreadKey(pane.uid, actor, rkey, MAX_DESCENDANTS + 1, MAX_ANCESTORS);

		return {
			queryKey: key,
			queryFn: getPostThread,
			placeholderData: () => getInitialPostThread(key),
		};
	});

	return (
		<div class="flex h-full flex-col bg-background">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<Show when={modal.depth > 0}>
					<button title="Close dialog" onClick={modal.close} class={/* @once */ iconButton({ edge: 'left' })}>
						<ArrowLeftIcon />
					</button>
				</Show>

				<div class="flex min-w-0 grow flex-col gap-0.5">
					<p class="overflow-hidden text-ellipsis whitespace-nowrap break-all text-base font-bold leading-5">
						Thread
					</p>
				</div>

				<button
					title="Close all dialogs"
					onClick={modal.reset}
					class={/* @once */ iconButton({ edge: 'right' })}
				>
					<CloseIcon />
				</button>
			</div>

			<div class="min-h-0 grow overflow-y-auto">
				<Switch>
					<Match when={thread.isLoading}>
						<div class="grid h-13 place-items-center">
							<CircularProgress />
						</div>
					</Match>

					<Match when={thread.data}>
						{(data) => {
							const ancestors = createMemo(() => {
								const $ancestors = data().ancestors;
								const overflow = $ancestors.length > MAX_ANCESTORS;

								return {
									overflowing: overflow,
									items: overflow ? ($ancestors.slice(-MAX_ANCESTORS) as any) : $ancestors,
								};
							});

							const focusRef = (node: HTMLElement) => {
								onMount(() => {
									node.scrollIntoView({ behavior: 'instant' });
								});
							};

							return (
								<>
									<Show
										when={(() => {
											if (thread.isPlaceholderData) {
												const $ancestors = ancestors();

												let post: SignalizedPost;

												if ($ancestors.overflowing) {
													return;
												}

												if ($ancestors.items.length > 0) {
													post = $ancestors.items[0];
												} else {
													post = data().post;
												}

												return post.record.value.reply;
											}
										})()}
									>
										<div class="relative flex h-13 px-4">
											<div class="flex w-10 flex-col items-center">
												<div class="mt-3 grow border-l-2 border-dashed border-divider" />
											</div>
											<div class="grid grow place-items-center">
												<CircularProgress />
											</div>
											<div class="w-10"></div>
										</div>
									</Show>

									<Show
										when={(() => {
											const $ancestors = ancestors();
											return $ancestors.overflowing && $ancestors.items[0];
										})()}
									>
										{(item) => (
											<Link
												to={{
													type: LinkingType.POST,
													actor: getRepoId(item().uri) as DID,
													rkey: getRecordId(item().uri),
												}}
												class="flex h-10 w-full items-center gap-3 px-4 hover:bg-hinted"
											>
												<div class="flex h-full w-10 justify-center">
													<div class="mt-3 border-l-2 border-dashed border-divider" />
												</div>
												<span class="text-sm text-accent">Show parent post</span>
											</Link>
										)}
									</Show>

									<For each={ancestors().items}>
										{(item) => {
											if ('$type' in item) {
												return null;
											}

											// Upwards scroll jank is a lot worse than downwards, so
											// we can't set an estimate height here.
											return (
												<VirtualContainer>
													<Post post={item} next prev interactive />
												</VirtualContainer>
											);
										}}
									</For>

									<div ref={focusRef} class="h-[calc(100%-0.75rem)] scroll-m-3">
										<PermalinkPost post={data().post} />

										<hr class="border-divider" />

										<For each={data().descendants}>
											{(slice) => {
												let overflowing = false;
												let items = slice.items;
												let len = items.length;

												if (len > MAX_DESCENDANTS) {
													overflowing = true;
													items = items.slice(0, MAX_DESCENDANTS) as any;
													len = MAX_DESCENDANTS;
												}

												return (
													<>
														{items.map((item, idx) => {
															if ('$type' in item) {
																return null;
															}

															return (
																<VirtualContainer estimateHeight={98.8}>
																	<Post post={item} interactive prev next={overflowing || idx !== len - 1} />
																</VirtualContainer>
															);
														})}

														{overflowing && (
															<Link
																to={{
																	type: LinkingType.POST,
																	actor: getRepoId(items[len - 1].uri) as DID,
																	rkey: getRecordId(items[len - 1].uri),
																}}
																class="flex h-10 w-full items-center gap-3 border-b border-divider px-4 hover:bg-hinted"
															>
																<div class="flex h-full w-10 justify-center">
																	<div class="mb-3 border-l-2 border-dashed border-divider" />
																</div>
																<span class="text-sm text-accent">Continue thread</span>
															</Link>
														)}
													</>
												);
											}}
										</For>

										<Switch>
											<Match when={thread.isPlaceholderData}>
												<div class="grid h-13 place-items-center">
													<CircularProgress />
												</div>
											</Match>

											<Match when>
												<div class="grid h-13 place-items-center">
													<p class="text-sm text-muted-fg">End of thread</p>
												</div>
											</Match>
										</Switch>
									</div>
								</>
							);
						}}
					</Match>
				</Switch>
			</div>
		</div>
	);
};

export default ThreadPaneDialog;
