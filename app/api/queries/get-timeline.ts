import { Agent } from '@externdefs/bluesky-client/agent';
import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import { assert } from '~/utils/misc.ts';

import type { DID, Records, RefOf, ResponseOf } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';
import { systemLanguages } from '../globals/platform.ts';

import {
	type ModerationCause,
	decideLabelModeration,
	decideMutedKeywordModeration,
	finalizeModeration,
} from '../moderation/action.ts';
import { PreferenceHide } from '../moderation/enums.ts';
import type { ModerationOpts } from '../moderation/types.ts';

import {
	type PostFilter,
	type SignalizedTimelineItem,
	type SliceFilter,
	type TimelineSlice,
	createTimelineSlices,
	createUnjoinedSlices,
} from '../models/timeline.ts';

import type { FilterPreferences, LanguagePreferences } from '../types.ts';

import { fetchPost } from './get-post.ts';

const PALOMAR_SERVICE = 'https://palomar.bsky.social';

type Post = RefOf<'app.bsky.feed.defs#postView'>;

export interface HomeTimelineParams {
	type: 'home';
	algorithm: 'reverse-chronological' | (string & {});
}

export interface FeedTimelineParams {
	type: 'feed';
	uri: string;
}

export interface ListTimelineParams {
	type: 'list';
	uri: string;
}

export interface ProfileTimelineParams {
	type: 'profile';
	actor: DID;
	tab: 'posts' | 'replies' | 'likes' | 'media';
}

export interface SearchTimelineParams {
	type: 'search';
	query: string;
}

export type TimelineParams =
	| FeedTimelineParams
	| HomeTimelineParams
	| ListTimelineParams
	| ProfileTimelineParams
	| SearchTimelineParams;

export interface TimelinePageCursor {
	key: string | null;
	remaining: TimelineSlice[];
}

export interface TimelinePage {
	cursor: TimelinePageCursor | undefined;
	cid: string | undefined;
	slices: TimelineSlice[];
}

export interface TimelineLatestResult {
	cid: string | undefined;
}

type TimelineResponse = ResponseOf<'app.bsky.feed.getTimeline'> & { cid?: string };

type PostRecord = Records['app.bsky.feed.post'];

//// Feed query
// How many attempts it should try looking for more items before it gives up on empty pages.
const MAX_EMPTY = 3;

const MAX_POSTS = 20;

const countPosts = (slices: TimelineSlice[], limit?: number) => {
	let count = 0;

	let idx = 0;
	let len = slices.length;

	for (; idx < len; idx++) {
		const slice = slices[idx];
		count += slice.items.length;

		if (limit !== undefined && count >= limit) {
			return idx;
		}
	}

	if (limit !== undefined) {
		return len;
	}

	return count;
};

export const getTimelineKey = (uid: DID, params: TimelineParams, limit = MAX_POSTS) => {
	return ['getFeed', uid, params, limit] as const;
};
export const getTimeline = async (
	ctx: QC<ReturnType<typeof getTimelineKey>, TimelinePageCursor | undefined>,
) => {
	const [, uid, params, limit] = ctx.queryKey;
	const pageParam = ctx.pageParam;
	const signal = ctx.signal;

	const timelineOpts = ctx.meta?.timelineOpts;

	const type = params.type;

	const agent = await multiagent.connect(uid);

	let empty = 0;
	let cid: string | undefined;

	let cursor: string | null | undefined;
	let items: TimelineSlice[] = [];
	let count = 0;

	let sliceFilter: SliceFilter | undefined | null;
	let postFilter: PostFilter | undefined;

	if (pageParam) {
		cursor = pageParam.key;
		items = pageParam.remaining;
		count = countPosts(items);
	}

	if (type === 'home') {
		sliceFilter = createHomeSliceFilter(uid);
		postFilter = combine([
			createHiddenRepostFilter(timelineOpts?.filters),
			createDuplicatePostFilter(items),
			createLabelPostFilter(timelineOpts?.moderation),
			createTempMutePostFilter(timelineOpts?.filters),
		]);
	} else if (type === 'feed' || type === 'list') {
		sliceFilter = createFeedSliceFilter();
		postFilter = combine([
			createDuplicatePostFilter(items),
			createLanguagePostFilter(timelineOpts?.language),
			createLabelPostFilter(timelineOpts?.moderation),
			createTempMutePostFilter(timelineOpts?.filters),
		]);
	} else if (type === 'profile') {
		postFilter = createLabelPostFilter(timelineOpts?.moderation);

		if (params.tab === 'likes' || params.tab === 'media') {
			sliceFilter = null;
		}
	} else {
		postFilter = createLabelPostFilter(timelineOpts?.moderation);
	}

	while (cursor !== null && count < limit) {
		const timeline = await fetchPage(agent, params, limit, cursor, signal);

		const feed = timeline.feed;
		const result =
			sliceFilter !== null
				? createTimelineSlices(uid, feed, sliceFilter, postFilter)
				: createUnjoinedSlices(uid, feed, postFilter);

		cursor = timeline.cursor || null;
		empty = result.length > 0 ? 0 : empty + 1;
		items = items.concat(result);

		count += countPosts(result);

		cid ||= timeline.cid || (feed.length > 0 ? feed[0].post.cid : undefined);

		if (empty >= MAX_EMPTY) {
			break;
		}
	}

	// we're still slicing by the amount of slices and not amount of posts
	const spliced = countPosts(items, limit) + 1;

	const slices = items.slice(0, spliced);
	const remaining = items.slice(spliced);

	const page: TimelinePage = {
		cursor: cursor || remaining.length > 0 ? { key: cursor || null, remaining: remaining } : undefined,
		cid: cid,
		slices: slices,
	};

	return page;
};

/// Latest feed query
export const getTimelineLatestKey = (uid: DID, params: TimelineParams) => {
	return ['getFeedLatest', uid, params] as const;
};
export const getTimelineLatest = async (ctx: QC<ReturnType<typeof getTimelineLatestKey>>) => {
	const [, uid, params] = ctx.queryKey;

	// Short-circuit search timeline so that we don't go through the hydration
	if (params.type === 'search') {
		const agent = new Agent({ serviceUri: PALOMAR_SERVICE });

		const response = await agent.rpc.get('app.bsky.unspecced.searchPostsSkeleton', {
			signal: ctx.signal,
			params: {
				q: params.query,
				limit: 1,
			},
		});

		const skeletons = response.data.posts;

		return { cid: skeletons.length > 0 ? skeletons[0].uri : undefined };
	}

	const agent = await multiagent.connect(uid);

	const timeline = await fetchPage(agent, params, 1, undefined, ctx.signal);
	const feed = timeline.feed;

	return { cid: feed.length > 0 ? feed[0].post.cid : undefined };
};

//// Raw fetch
const fetchPage = async (
	agent: Agent,
	params: TimelineParams,
	limit: number,
	cursor: string | undefined,
	signal?: AbortSignal,
): Promise<TimelineResponse> => {
	const type = params.type;

	if (type === 'home') {
		const response = await agent.rpc.get('app.bsky.feed.getTimeline', {
			signal: signal,
			params: {
				algorithm: params.algorithm,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'feed') {
		const response = await agent.rpc.get('app.bsky.feed.getFeed', {
			signal: signal,
			params: {
				feed: params.uri,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'list') {
		const response = await agent.rpc.get('app.bsky.feed.getListFeed', {
			signal: signal,
			params: {
				list: params.uri,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'profile') {
		if (params.tab === 'likes') {
			const response = await agent.rpc.get('app.bsky.feed.getActorLikes', {
				signal: signal,
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
				},
			});

			return response.data;
		} else {
			const response = await agent.rpc.get('app.bsky.feed.getAuthorFeed', {
				signal: signal,
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
					filter:
						params.tab === 'media'
							? 'posts_with_media'
							: params.tab === 'replies'
							  ? 'posts_with_replies'
							  : 'posts_no_replies',
				},
			});

			return response.data;
		}
	} else if (type === 'search') {
		const palomar = new Agent({ serviceUri: PALOMAR_SERVICE });

		const skeleton = await palomar.rpc.get('app.bsky.unspecced.searchPostsSkeleton', {
			signal: signal,
			params: {
				q: params.query,
				cursor: cursor,
				limit: limit,
			},
		});

		const data = skeleton.data;
		const skeletons = data.posts;

		const uid = agent.session!.did;
		const promises = await Promise.allSettled(skeletons.map((post) => fetchPost([uid, post.uri])));

		signal?.throwIfAborted();

		return {
			cid: skeletons.length > 0 ? skeletons[0].uri : undefined,
			cursor: data.cursor,
			feed: promises
				.filter((x): x is PromiseFulfilledResult<Post> => x.status === 'fulfilled')
				.map((x) => ({ post: x.value })),
		};
	} else {
		assert(false, `Unknown type: ${type}`);
	}
};

/// Timeline filters
type FilterFn<T> = (data: T) => boolean;

const combine = <T>(filters: Array<undefined | FilterFn<T>>): FilterFn<T> | undefined => {
	const filtered = filters.filter((filter): filter is FilterFn<T> => filter !== undefined);
	const len = filtered.length;

	if (len === 1) {
		return filtered[0];
	}

	if (len === 0) {
		return;
	}

	return (data: T) => {
		for (let idx = 0; idx < len; idx++) {
			const filter = filtered[idx];

			if (!filter(data)) {
				return false;
			}
		}

		return true;
	};
};

const createDuplicatePostFilter = (slices: TimelineSlice[]): PostFilter => {
	const map: Record<string, boolean> = {};

	for (let i = 0, il = slices.length; i < il; i++) {
		const slice = slices[i];
		const items = slice.items;

		for (let j = 0, jl = items.length; j < jl; j++) {
			const item = items[j];
			const uri = item.post.uri;

			map[uri] = true;
		}
	}

	return (item) => {
		const uri = item.post.uri;

		if (map[uri]) {
			return false;
		}

		return (map[uri] = true);
	};
};

const createLabelPostFilter = (opts?: ModerationOpts): PostFilter | undefined => {
	if (!opts) {
		return;
	}

	return (item) => {
		const post = item.post;
		const labels = post.labels;

		const accu: ModerationCause[] = [];
		decideLabelModeration(accu, labels, post.author.did, opts);
		decideMutedKeywordModeration(accu, (post.record as PostRecord).text, PreferenceHide, opts);

		const decision = finalizeModeration(accu);

		return !decision?.f;
	};
};

const createLanguagePostFilter = (prefs?: LanguagePreferences): PostFilter | undefined => {
	if (!prefs) {
		return;
	}

	const allowUnspecified = prefs.allowUnspecified;
	let languages = prefs.languages;

	if (prefs.useSystemLanguages) {
		languages = languages ? systemLanguages.concat(languages) : systemLanguages;
	}

	if (!languages || languages.length < 1) {
		return;
	}

	return (item) => {
		const record = item.post.record as PostRecord;
		const langs = record.langs;

		if (!record.text) {
			return true;
		}

		if (!langs || langs.length < 1) {
			return allowUnspecified;
		}

		return langs.some((code) => languages!.includes(code));
	};
};

const createHiddenRepostFilter = (prefs?: FilterPreferences): PostFilter | undefined => {
	if (!prefs) {
		return;
	}

	const hidden = prefs.hideReposts;

	if (hidden.length < 1) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		return !reason || reason.$type !== 'app.bsky.feed.defs#reasonRepost' || !hidden.includes(reason.by.did);
	};
};

const createTempMutePostFilter = (prefs?: FilterPreferences): PostFilter | undefined => {
	if (!prefs) {
		return;
	}

	const now = Date.now();

	const mutes = prefs.tempMutes;
	let hasMutes = false;

	// check if there are any outdated mutes before proceeding
	for (const did in mutes) {
		const date = mutes[did as DID];

		if (date === undefined || now >= date) {
			delete mutes[did as DID];
		} else {
			hasMutes = true;
		}
	}

	if (!hasMutes) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		if (reason) {
			const byDid = reason.by.did;

			if (mutes![byDid] && now < mutes![byDid]!) {
				return false;
			}
		}

		const did = item.post.author.did;

		if (mutes![did] && now < mutes![did]!) {
			return false;
		}

		return true;
	};
};

const createFeedSliceFilter = (): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		// skip any posts that are in reply to non-followed
		if (first.reply) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			const rAuthor = root.author;
			const pAuthor = parent.author;

			const rViewer = rAuthor.viewer;
			const pViewer = pAuthor.viewer;

			if (rViewer.muted.peek() || pViewer.muted.peek()) {
				return yankReposts(items);
			}
		}

		return true;
	};
};

const createHomeSliceFilter = (uid: DID): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		// skip any posts that are in reply to non-followed
		if (first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			const rAuthor = root.author;
			const pAuthor = parent.author;

			const rViewer = rAuthor.viewer;
			const pViewer = pAuthor.viewer;

			if (
				(rAuthor.did !== uid && (!rViewer.following.peek() || rViewer.muted.peek())) ||
				(pAuthor.did !== uid && (!pViewer.following.peek() || pViewer.muted.peek()))
			) {
				return yankReposts(items);
			}
		} else if (first.post.record.peek().reply) {
			return yankReposts(items);
		}

		return true;
	};
};

// Get the reposts out of the gutter
const yankReposts = (items: SignalizedTimelineItem[]): TimelineSlice[] | false => {
	let slices: TimelineSlice[] | false = false;
	let last: SignalizedTimelineItem[] | undefined;

	for (let idx = 0, len = items.length; idx < len; idx++) {
		const item = items[idx];

		if (item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost') {
			if (last) {
				last.push(item);
			} else {
				(slices ||= []).push({ items: (last = [item]) });
			}
		} else {
			last = undefined;
		}
	}

	return slices;
};
