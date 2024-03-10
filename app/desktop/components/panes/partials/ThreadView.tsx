import { For, Match, Show, Suspense, Switch, lazy, onMount } from 'solid-js';

import { XRPCError } from '@mary/bluesky-client/xrpc';
import { type CreateQueryResult } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import type { ThreadData } from '~/api/models/threads';
import { BlockedThreadError } from '~/api/queries/get-post-thread';
import { SignalizedPost } from '~/api/stores/posts';

import { preferences } from '../../../globals/settings';

import { Button } from '~/com/primitives/button';

import CircularProgress from '~/com/components/CircularProgress';
import Keyed from '~/com/components/Keyed';
import { LINK_POST, LINK_PROFILE, Link } from '~/com/components/Link';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import GenericErrorView from '~/com/components/views/GenericErrorView';
import PermalinkPost from '~/com/components/views/PermalinkPost';

import EmbedRecordBlocked from '~/com/components/embeds/EmbedRecordBlocked';
import EmbedRecordNotFound from '~/com/components/embeds/EmbedRecordNotFound';
import Post from '~/com/components/items/Post';

const FlattenedThread = lazy(() => import('~/com/components/views/threads/FlattenedThread'));
const NestedThread = lazy(() => import('~/com/components/views/threads/NestedThread'));

export interface ThreadViewProps {
	actor: At.DID;
	thread: CreateQueryResult<ThreadData, Error>;
}

const ThreadView = (props: ThreadViewProps) => {
	const actor = props.actor;
	const thread = props.thread;

	const ui = preferences.ui;

	return (
		<Switch>
			<Match when={thread.isLoading}>
				<div class="grid h-13 place-items-center">
					<CircularProgress />
				</div>
			</Match>

			<Match when={thread.error} keyed>
				{(err) => {
					if (err instanceof XRPCError && err.kind === 'NotFound') {
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
										const $data = data();

										const ancestors = $data.ancestors;
										const first = ancestors.length > 0 ? ancestors[0] : $data.post;

										if (first instanceof SignalizedPost) {
											return first.record.value.reply;
										}
									}
								})()}
							>
								<div class="relative flex h-13 px-4">
									<div class="flex w-9 flex-col items-center">
										<div class="mt-3 grow border-l-2 border-dashed border-divider" />
									</div>
									<div class="grid grow place-items-center">
										<CircularProgress />
									</div>
									<div class="w-9"></div>
								</div>
							</Show>

							<For each={data().ancestors}>
								{(item) => {
									if (item instanceof SignalizedPost) {
										// Upwards scroll jank is a lot worse than downwards, so
										// we can't set an estimate height here.
										return (
											<VirtualContainer class="shrink-0">
												<Post post={item} next prev interactive />
											</VirtualContainer>
										);
									}

									const type = item.$type;

									if (type === 'overflow') {
										const uri = item.uri;
										const actor = getRepoId(uri) as At.DID;
										const rkey = getRecordId(uri);

										return (
											<Link
												to={{ type: LINK_POST, actor: actor, rkey: rkey }}
												class="flex h-10 w-full shrink-0 items-center gap-3 px-4 hover:bg-secondary/10"
											>
												<div class="flex h-full w-9 justify-center">
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
									{!ui.threadedReplies ? <FlattenedThread data={data()} /> : <NestedThread data={data()} />}

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
	);
};

export default ThreadView;
