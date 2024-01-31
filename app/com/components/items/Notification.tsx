import { type Accessor, type JSX, Match, Switch, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import type {
	FollowNotification,
	FollowNotificationSlice,
	LikeNotification,
	LikeNotificationSlice,
	NotificationSlice,
	RepostNotification,
	RepostNotificationSlice,
} from '~/api/models/notifications.ts';
import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import { LINK_PROFILE, Link } from '../Link.tsx';
import CircularProgress from '../CircularProgress.tsx';
import { VirtualContainer } from '../VirtualContainer.tsx';

import ChevronRightIcon from '../../icons/baseline-chevron-right.tsx';
import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import PersonIcon from '../../icons/baseline-person.tsx';
import RepeatIcon from '../../icons/baseline-repeat.tsx';

import EmbedQuote from '../embeds/EmbedQuote.tsx';
import GenericErrorView from '../views/GenericErrorView.tsx';
import Post from './Post.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

export interface NotificationProps {
	uid: DID;
	data: NotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show before considering truncation
const MAX_AVATARS = 5;

const ICON_MAP = {
	follow: { component: PersonIcon, class: 'text-accent' },
	like: { component: FavoriteIcon, class: 'text-red-600' },
	repost: { component: RepeatIcon, class: 'text-green-600' },
};

const Notification = (props: NotificationProps) => {
	return (
		<Switch>
			<Match
				when={(() => {
					const data = props.data;
					const type = data.type;

					if (type === 'reply' || type === 'quote' || type === 'mention') {
						return data;
					}
				})()}
				keyed
			>
				{(data) => {
					const uri = data.item.uri;

					const post = createQuery(() => {
						const key = getPostKey(props.uid, uri);

						return {
							queryKey: key,
							queryFn: getPost,
							initialDataUpdatedAt: 0,
							initialData: getInitialPost(key),
						};
					});

					return (
						<Switch>
							<Match when={post.data} keyed>
								<VirtualContainer estimateHeight={118.3}>
									<Post interactive post={post.data!} highlight={!data.read} />
								</VirtualContainer>
							</Match>

							<Match when={post.error}>
								<div class="border-b border-divider">
									<GenericErrorView error={post.error!} onRetry={() => post.refetch()} />
								</div>
							</Match>

							<Match when>
								<div class="grid place-items-center border-b border-divider p-3" style="height: 118.3px">
									<CircularProgress />
								</div>
							</Match>
						</Switch>
					);
				}}
			</Match>

			<Match
				when={(() => {
					const data = props.data;
					const type = data.type;

					if (type === 'follow' || type === 'like' || type === 'repost') {
						return data;
					}
				})()}
				keyed
			>
				{(data) => {
					const type = data.type;

					const read = data.read;
					const items = data.items;

					const { component: IconComponent, class: iconClassname } = ICON_MAP[type];

					const avatars = renderAvatars(items);
					const text = renderText(data);
					const accessory = renderAccessory(() => props.uid, data);

					return (
						<div class="relative flex gap-3 border-b border-divider px-4 py-3">
							{!read && <div class="absolute bottom-0 left-0 top-0 w-1 bg-accent/60"></div>}

							<div class="flex w-10 shrink-0 flex-col items-end gap-3">
								<div class="grid h-7.5 w-7.5 place-items-center">
									<IconComponent class={iconClassname + ` text-2xl`} />
								</div>
							</div>
							<div class="flex min-w-0 grow flex-col gap-3">
								{avatars}
								<div class="overflow-hidden break-words text-sm">{text}</div>

								{accessory}
							</div>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};

export default Notification;

const renderAvatars = (items: (FollowNotification | LikeNotification | RepostNotification)[]) => {
	if (items.length === 1) {
		const item = items[0];
		const { did, avatar, displayName, handle } = item.author;

		return (
			<div class="flex gap-2 overflow-hidden">
				<Link
					to={{ type: LINK_PROFILE, actor: did }}
					title={displayName ? `${displayName} (@${handle})` : `@${handle}`}
					class="h-7.5 w-7.5 shrink-0 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
				>
					<img src={avatar || DefaultAvatar} class="h-full w-full" />
				</Link>
			</div>
		);
	}

	{
		const [show, setShow] = createSignal(false);
		const remaining = items.length - MAX_AVATARS;

		return (
			<div class="flex flex-col gap-3">
				<button
					title={!show() ? `Show list of ${items.length} users` : `Hide users`}
					onClick={() => setShow(!show())}
					class={
						/* @once */ Interactive({
							class: `-m-1 flex items-center gap-2 self-baseline overflow-hidden rounded p-1`,
						})
					}
				>
					{(() => {
						if (!show()) {
							const avatars = items.slice(0, MAX_AVATARS).map((item) => {
								const avatar = item.author.avatar;

								return (
									<div class="h-7.5 w-7.5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
										<img src={avatar || DefaultAvatar} class="h-full w-full" />
									</div>
								);
							});

							return [
								avatars,
								remaining > 0 && <span class="-mr-1 ml-1 text-xs font-bold text-muted-fg">+{remaining}</span>,
								<ChevronRightIcon class="mr-1 rotate-90 text-xl text-muted-fg" />,
							];
						}

						return (
							<div class="flex h-7.5 items-center gap-2">
								<ChevronRightIcon class="-rotate-90 text-xl" />
								<span class="pr-1 text-sm">Hide</span>
							</div>
						);
					})()}
				</button>

				{(() => {
					if (!show()) {
						return null;
					}

					return items.map((item) => {
						const { did, avatar, displayName, handle } = item.author;

						return (
							<Link
								to={{ type: LINK_PROFILE, actor: did }}
								class={
									/* @once */ Interactive({
										class: `-m-1 flex min-w-0 items-center rounded p-1 text-left text-sm`,
									})
								}
							>
								<div class="mr-2 h-7.5 w-7.5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
									<img src={avatar || DefaultAvatar} class="h-full w-full" />
								</div>

								<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap font-bold text-primary empty:hidden">
									{displayName}
								</span>
								<span class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">@{handle}</span>
							</Link>
						);
					});
				})()}
			</div>
		);
	}
};

const renderText = (data: FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice) => {
	const items = data.items;
	const sliced = Math.min(items.length, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
	const remaining = items.length - sliced;

	const type = data.type;

	const nodes: JSX.Element[] = [];

	for (let idx = 0; idx < sliced; idx++) {
		const item = items[idx];
		const author = item.author;

		if (sliced > 1) {
			if (remaining < 1 && idx === sliced - 1) {
				nodes.push(` and `);
			} else if (idx !== 0) {
				nodes.push(`, `);
			}
		}

		nodes.push(
			<Link
				to={{ type: LINK_PROFILE, actor: author.did }}
				dir="auto"
				class="inline-block overflow-hidden text-left align-top font-bold hover:underline"
			>
				{author.displayName?.trim() || `@${author.handle}`}
			</Link>,
		);
	}

	if (remaining > 0) {
		nodes.push(` and ${remaining} others`);
	}

	if (type === 'follow') {
		nodes.push(` followed you`);
	} else if (type === 'like') {
		nodes.push(` liked your post`);
	} else if (type === 'repost') {
		nodes.push(` reposted your post`);
	}

	return nodes;
};

const renderAccessory = (
	uid: Accessor<DID>,
	data: FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice,
) => {
	const type = data.type;

	if (type === 'like' || type === 'repost') {
		const uri = data.items[0].record.subject.uri;

		const post = createQuery(() => {
			const key = getPostKey(uid(), uri);

			return {
				queryKey: key,
				queryFn: getPost,
				initialDataUpdatedAt: 0,
				initialData: getInitialPost(key),
			};
		});

		return (
			<Switch>
				<Match when={post.data} keyed>
					{(data) => {
						const author = data.author;
						const record = () => data.record.value;

						return (
							// nice
							<VirtualContainer estimateHeight={69.6} class="flex flex-col">
								<EmbedQuote
									record={{
										$type: 'app.bsky.embed.record#viewRecord',
										uri: data.uri,
										// @ts-expect-error
										cid: null,
										// @ts-expect-error
										indexedAt: null,
										author: {
											did: author.did,
											avatar: author.avatar.value,
											handle: author.handle.value,
											displayName: author.displayName.value,
										},
										embeds: data.embed.value ? [data.embed.value!] : [],
										value: {
											createdAt: record().createdAt,
											text: record().text,
										},
									}}
								/>
							</VirtualContainer>
						);
					}}
				</Match>

				<Match when={post.error}>
					<div class="rounded-md border border-divider">
						<GenericErrorView error={post.error} onRetry={() => post.refetch()} />
					</div>
				</Match>

				<Match when>
					<div class="grid place-items-center rounded-md border border-divider p-3" style="height: 69.6px">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		);
	}

	return null;
};
