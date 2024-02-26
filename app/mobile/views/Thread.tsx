import { For, Match, Show, Switch } from 'solid-js';

import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';
import { useParams } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import {
	BlockedThreadError,
	getInitialPostThread,
	getPostThread,
	getPostThreadKey,
} from '~/api/queries/get-post-thread';
import { SignalizedPost } from '~/api/stores/posts';

import GenericErrorView from '~/com/components/views/GenericErrorView';
import CircularProgress from '~/com/components/CircularProgress';
import { LINK_POST, LINK_PROFILE, Link } from '~/com/components/Link';
import Keyed from '~/com/components/Keyed';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import { Button } from '~/com/primitives/button';

import ViewHeader from '../components/ViewHeader';

import EmbedRecordBlocked from '~/com/components/embeds/EmbedRecordBlocked';
import EmbedRecordNotFound from '~/com/components/embeds/EmbedRecordNotFound';
import Post from '~/com/components/items/Post';
import FlattenedThread from '~/com/components/views/threads/FlattenedThread';
import PermalinkPost from '~/com/components/views/PermalinkPost';

const ThreadView = () => {
	const { actor, post: rkey } = useParams<{ actor: At.DID; post: string }>();

	const query = createQuery(() => {
		const key = getPostThreadKey(multiagent.active!, actor, rkey, 4, 10);

		return {
			queryKey: key,
			queryFn: getPostThread,
			placeholderData: () => getInitialPostThread(key),
		};
	});

	return (
		<div class="contents">
			<ViewHeader title="Thread" back={`/${actor}`} />

			<Switch>
				<Match when={query.error} keyed>
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

						return <GenericErrorView error={err} onRetry={() => query.refetch()} />;
					}}
				</Match>

				<Match when={query.data}>
					{(data) => {
						return (
							<>
								<Show
									when={(() => {
										if (query.isPlaceholderData) {
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
										requestAnimationFrame(() => {
											node.scrollIntoView({ behavior: 'instant' });
										});
									}}
									class="scroll-m-16"
									style={{ 'min-height': 'calc(100vh - 3.25rem - 0.75rem)' }}
								>
									<VirtualContainer>
										<Keyed key={data().post}>
											<PermalinkPost post={data().post} />
										</Keyed>

										<hr class="border-divider" />
									</VirtualContainer>

									<FlattenedThread data={data()} />

									<div class="grid h-13 place-items-center">
										{(() => {
											if (query.isPlaceholderData) {
												return <CircularProgress />;
											}

											return <p class="text-sm text-muted-fg">End of thread</p>;
										})()}
									</div>
								</div>
							</>
						);
					}}
				</Match>

				<Match when>
					<div class="grid h-13 place-items-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default ThreadView;
