import { For, Match, Show, Suspense, Switch, lazy, onMount } from 'solid-js';

import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';
import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import {
	BlockedThreadError,
	getInitialPostThread,
	getPostThread,
	getPostThreadKey,
} from '~/api/queries/get-post-thread.ts';
import { SignalizedPost } from '~/api/stores/posts.ts';

import { Button } from '~/com/primitives/button.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import Keyed from '~/com/components/Keyed.ts';
import { LINK_POST, LINK_PROFILE, Link } from '~/com/components/Link.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import GenericErrorView from '~/com/components/views/GenericErrorView.tsx';
import PermalinkPost from '~/com/components/views/PermalinkPost.tsx';

import EmbedRecordBlocked from '~/com/components/embeds/EmbedRecordBlocked.tsx';
import EmbedRecordNotFound from '~/com/components/embeds/EmbedRecordNotFound.tsx';
import Post from '~/com/components/items/Post.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

const FlattenedThread = lazy(() => import('~/com/components/views/threads/FlattenedThread.tsx'));

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

	const thread = createQuery(() => {
		const key = getPostThreadKey(pane.uid, actor, rkey, MAX_DESCENDANTS, MAX_ANCESTORS);

		return {
			queryKey: key,
			queryFn: getPostThread,
			placeholderData: () => getInitialPostThread(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader title="Thread" />

			<div class="min-h-0 grow overflow-y-auto">
				<Switch>
					<Match when={thread.isLoading}>
						<div class="grid h-13 place-items-center">
							<CircularProgress />
						</div>
					</Match>

					<Match when={thread.error} keyed>
						{(err) => {
							if (err instanceof XRPCError && err.error === 'NotFound') {
								return (
									<div class="p-3">
										<EmbedRecordNotFound />
									</div>
								);
							}

							if (err instanceof BlockedThreadError) {
								const viewer = err.view.author.viewer;

								if (viewer?.blocking) {
									return (
										<div class="p-4">
											<div class="mb-4 text-sm">
												<p class="font-bold">This post is from a user you blocked</p>
												<p class="text-muted-fg">You need to unblock the user to view the post.</p>
											</div>

											<Link
												to={{ type: LINK_PROFILE, actor: actor }}
												class={/* @once */ Button({ variant: 'primary' })}
											>
												View profile
											</Link>
										</div>
									);
								}

								return (
									<div class="p-3">
										<EmbedRecordNotFound />
									</div>
								);
							}

							return <GenericErrorView error={err} onRetry={() => thread.refetch()} />;
						}}
					</Match>

					<Match when={thread.data}>
						{(data) => {
							return (
								<>
									<Show
										when={(() => {
											if (thread.isPlaceholderData) {
												const ancestors = data().ancestors;
												const first = ancestors.length > 0 && ancestors[0];

												if (first && first instanceof SignalizedPost) {
													return first.record.value.reply;
												}
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

									<For each={data().ancestors}>
										{(item) => {
											if (item instanceof SignalizedPost) {
												// Upwards scroll jank is a lot worse than downwards, so
												// we can't set an estimate height here.
												return (
													<VirtualContainer>
														<Post post={item} next prev interactive />
													</VirtualContainer>
												);
											}

											const type = item.$type;

											if (type === 'overflow') {
												const uri = item.uri;
												const actor = getRepoId(uri) as DID;
												const rkey = getRecordId(uri);

												return (
													<Link
														to={{ type: LINK_POST, actor: actor, rkey: rkey }}
														class="flex h-10 w-full items-center gap-3 px-4 hover:bg-secondary/10"
													>
														<div class="flex h-full w-10 justify-center">
															<div class="mt-3 border-l-2 border-dashed border-divider" />
														</div>
														<span class="text-sm text-accent">Show parent post</span>
													</Link>
												);
											}

											if (type === 'app.bsky.feed.defs#notFoundPost') {
												return (
													<div class="p-3">
														<EmbedRecordNotFound />
													</div>
												);
											}

											if (type === 'app.bsky.feed.defs#blockedPost') {
												return (
													<div class="p-3">
														<EmbedRecordBlocked
															record={
																/* @once */ {
																	uri: item.uri,
																	blocked: item.blocked,
																	author: item.author,
																}
															}
														/>
													</div>
												);
											}

											return null;
										}}
									</For>

									<div
										ref={(node: HTMLElement) => {
											onMount(() => {
												node.scrollIntoView({ behavior: 'instant' });
											});
										}}
										class="h-[calc(100%-0.75rem)] scroll-m-3"
									>
										<VirtualContainer>
											<Keyed key={data().post}>
												<PermalinkPost post={data().post} />
											</Keyed>

											<hr class="border-divider" />
										</VirtualContainer>

										<Suspense
											fallback={
												<div class="grid h-13 place-items-center">
													<CircularProgress />
												</div>
											}
										>
											<FlattenedThread data={data()} />

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
										</Suspense>
									</div>
								</>
							);
						}}
					</Match>
				</Switch>
			</div>
		</PaneDialog>
	);
};

export default ThreadPaneDialog;
