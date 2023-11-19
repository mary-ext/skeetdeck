import { type JSX, Switch, Match, For } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import type {
	FollowNotificationSlice,
	LikeNotificationSlice,
	NotificationSlice,
	RepostNotificationSlice,
} from '~/api/models/notifications.ts';
import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';

import { Link, LinkingType } from '../Link.tsx';
import CircularProgress from '../CircularProgress.tsx';

import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import PersonIcon from '../../icons/baseline-person.tsx';
import RepeatIcon from '../../icons/baseline-repeat.tsx';

import Post from './Post.tsx';
import { VirtualContainer } from '../VirtualContainer.tsx';

export interface NotificationProps {
	uid: DID;
	data: NotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show
const MAX_AVATARS = 6;

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
							<Match when={post.data}>
								{(post) => {
									return (
										<VirtualContainer estimateHeight={98.8}>
											<Post interactive post={post()} highlight={!data.read} />
										</VirtualContainer>
									);
								}}
							</Match>

							<Match when>
								<div class="grid place-items-center border-b border-divider p-3">
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

					const avatars = items.slice(0, MAX_AVATARS).map((item) => {
						const { did, avatar, displayName, handle } = item.author;

						return (
							<Link
								to={{ type: LinkingType.PROFILE, actor: did }}
								title={displayName ? `${displayName} (@${handle})` : `@${handle}`}
								class="h-7.5 w-7.5 shrink-0 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
							>
								{avatar && <img src={avatar} class="h-full w-full" />}
							</Link>
						);
					});

					const text = renderText(data);

					return (
						<div class={`flex gap-3 border-b border-divider px-4 py-3` + (!read ? ` bg-accent/20` : ``)}>
							<div class="flex w-10 shrink-0 flex-col items-end gap-3">
								<IconComponent class={iconClassname + ` text-2xl`} />
							</div>
							<div class="flex min-w-0 grow flex-col gap-3">
								<div class="flex gap-2 overflow-hidden">{avatars}</div>
								<div class="overflow-hidden break-words text-sm">{text}</div>
							</div>

							{/* @todo: accessory */}
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};

export default Notification;

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
				to={{ type: LinkingType.PROFILE, actor: author.did }}
				dir="auto"
				class="inline-block overflow-hidden align-top font-bold hover:underline"
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
