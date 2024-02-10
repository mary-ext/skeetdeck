import { Agent } from '@externdefs/bluesky-client/agent';
import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import { assert, mapDefined } from '~/utils/misc';

import type { DID, Records, RefOf, ResponseOf } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { systemLanguages } from '../globals/platform';

import { wrapInfiniteQuery } from '../utils/query';

import {
	type ModerationCause,
	decideLabelModeration,
	decideMutedKeywordModeration,
	finalizeModeration,
} from '../moderation/action';
import { PreferenceHide } from '../moderation/enums';
import type { ModerationOpts } from '../moderation/types';

import {
	type PostFilter,
	type SignalizedTimelineItem,
	type SliceFilter,
	type TimelineSlice,
	createTimelineSlices,
	createUnjoinedSlices,
} from '../models/timeline';

import type { FilterPreferences, LanguagePreferences } from '../types';

import _getDid from './_did';
import { fetchPost } from './get-post';

const PALOMAR_SERVICE = 'https://palomar.bsky.social';

export interface HomeTimelineParams {
	type: 'home';
	algorithm: 'reverse-chronological' | (string & {});
	showReplies: 'follows' | boolean;
	showReposts: boolean;
	showQuotes: boolean;
}

export interface FeedTimelineParams {
	type: 'feed';
	uri: string;
	showReplies: boolean;
	showReposts: boolean;
	showQuotes: boolean;
}

export interface ListTimelineParams {
	type: 'list';
	uri: string;
	showReplies: boolean;
	showQuotes: boolean;
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

const MAX_POSTS = 30;

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
	return ['getTimeline', uid, params, limit] as const;
};
export const getTimeline = wrapInfiniteQuery(
	async (ctx: QC<ReturnType<typeof getTimelineKey>, TimelinePageCursor | undefined>) => {
		const [, uid, params, limit] = ctx.queryKey;
		const pageParam = ctx.pageParam;

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
			sliceFilter = createHomeSliceFilter(uid, params.showReplies === 'follows');

			postFilter = combine([
				createHiddenRepostFilter(timelineOpts?.filters),
				createDuplicatePostFilter(items),

				!params.showReplies && createHideRepliesFilter(),
				!params.showQuotes && createHideQuotesFilter(),
				!params.showReposts && createHideRepostsFilter(),

				createInvalidReplyFilter(),
				createLabelPostFilter(timelineOpts?.moderation),
				createTempMutePostFilter(uid, timelineOpts?.filters),
			]);
		} else if (type === 'feed' || type === 'list') {
			sliceFilter = createFeedSliceFilter();
			postFilter = combine([
				type === 'feed' && createHiddenRepostFilter(timelineOpts?.filters),
				createDuplicatePostFilter(items),

				!params.showReplies && createHideRepliesFilter(),
				!params.showQuotes && createHideQuotesFilter(),
				type === 'feed' && !params.showReposts && createHideQuotesFilter(),

				createLanguagePostFilter(timelineOpts?.language),
				createLabelPostFilter(timelineOpts?.moderation),
				createTempMutePostFilter(uid, timelineOpts?.filters),
			]);
		} else if (type === 'profile') {
			postFilter = createLabelPostFilter(timelineOpts?.moderation);

			if (params.tab === 'posts') {
				const did = await _getDid(agent, params.actor);
				sliceFilter = createProfileSliceFilter(did);
				postFilter = combine([createInvalidReplyFilter(), createLabelPostFilter(timelineOpts?.moderation)]);
			} else if (params.tab === 'likes' || params.tab === 'media') {
				sliceFilter = null;
			}
		} else {
			postFilter = createLabelPostFilter(timelineOpts?.moderation);
		}

		while (cursor !== null && count < limit) {
			const timeline = await fetchPage(agent, params, limit, cursor, ctx);

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
	},
);

/// Latest feed query
export const getTimelineLatestKey = (uid: DID, params: TimelineParams) => {
	return ['getTimelineLatest', uid, params] as const;
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

	const timeline = await fetchPage(agent, params, 1, undefined, ctx);
	const feed = timeline.feed;

	return { cid: feed.length > 0 ? feed[0].post.cid : undefined };
};

//// Raw fetch
const fetchPage = async (
	agent: Agent,
	params: TimelineParams,
	limit: number,
	cursor: string | undefined,
	context: QC,
): Promise<TimelineResponse> => {
	const type = params.type;
	const signal = context.signal;

	let headers: Record<string, string> | undefined;
	if (context.meta?.timelineOpts) {
		const prefs = context.meta.timelineOpts.language;
		const langs = resolveLanguages(prefs.languages, prefs.useSystemLanguages);

		headers = { ['accept-language']: langs.join(',') };
	}

	if (type === 'home') {
		const response = await agent.rpc.get('app.bsky.feed.getTimeline', {
			signal: signal,
			headers: headers,
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
			headers: headers,
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
			headers: headers,
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
				headers: headers,
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
				headers: headers,
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
					filter:
						params.tab === 'media'
							? 'posts_with_media'
							: params.tab === 'replies'
								? 'posts_with_replies'
								: 'posts_and_author_threads',
				},
			});

			return response.data;
		}
	} else if (type === 'search') {
		const palomar = new Agent({ serviceUri: PALOMAR_SERVICE });

		const skeleton = await palomar.rpc.get('app.bsky.unspecced.searchPostsSkeleton', {
			signal: signal,
			headers: headers,
			params: {
				q: params.query,
				cursor: cursor,
				limit: limit,
			},
		});

		const data = skeleton.data;
		const skeletons = data.posts;

		const uid = agent.session!.did;
		const results = await Promise.allSettled(skeletons.map((post) => fetchPost([uid, post.uri])));

		signal?.throwIfAborted();

		return {
			cid: skeletons.length > 0 ? skeletons[0].uri : undefined,
			cursor: data.cursor,
			feed: mapDefined(results, (x) => (x.status === 'fulfilled' ? { post: x.value } : undefined)),
		};
	} else {
		assert(false, `Unknown type: ${type}`);
	}
};

/// Timeline filters
type FilterFn<T> = (data: T) => boolean;

const combine = <T>(filters: Array<undefined | false | FilterFn<T>>): FilterFn<T> | undefined => {
	const filtered = filters.filter((filter): filter is FilterFn<T> => !!filter);
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

//// Post filters
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

const createInvalidReplyFilter = (): PostFilter => {
	return (item) => {
		// There's no reply attached but the record says it has, let's filter these out.
		if (!item.reply && (item.post.record as PostRecord).reply) {
			return false;
		}

		return true;
	};
};

const createLabelPostFilter = (opts?: ModerationOpts): PostFilter | undefined => {
	if (!opts) {
		return;
	}

	const unwrapImageAlt = (embed: PostRecord['embed']) => {
		let str = '';
		let images: RefOf<'app.bsky.embed.images#image'>[] | undefined;

		if (embed) {
			if (embed.$type === 'app.bsky.embed.images') {
				images = embed.images;
			} else if (
				embed.$type === 'app.bsky.embed.recordWithMedia' &&
				embed.media.$type === 'app.bsky.embed.images'
			) {
				images = embed.media.images;
			}
		}

		if (images) {
			for (let i = 0, il = images.length; i < il; i++) {
				str += ' ' + images[i].alt;
			}
		}

		return str;
	};

	return (item) => {
		const post = item.post;

		const author = post.author;
		const record = post.record as PostRecord;

		const isFollowing = !!author.viewer?.following;
		const text = record.text + unwrapImageAlt(record.embed);

		record.embed;

		const accu: ModerationCause[] = [];
		decideLabelModeration(accu, post.labels, post.author.did, opts);
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceHide, opts);

		const decision = finalizeModeration(accu);

		return !decision?.f;
	};
};

const createLanguagePostFilter = (prefs?: LanguagePreferences): PostFilter | undefined => {
	if (!prefs) {
		return;
	}

	const allowUnspecified = prefs.allowUnspecified;
	const languages = resolveLanguages(prefs.languages, prefs.useSystemLanguages);

	if (languages.length < 1) {
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

const createTempMutePostFilter = (uid: DID, prefs?: FilterPreferences): PostFilter | undefined => {
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
			const did = reason.by.did;

			if (did !== uid && mutes![did] && now < mutes![did]!) {
				return false;
			}
		}

		const did = item.post.author.did;

		if (did !== uid && mutes![did] && now < mutes![did]!) {
			return false;
		}

		return true;
	};
};

const createHideRepliesFilter = (): PostFilter => {
	return (item) => {
		return item.reply === undefined && (item.post.record as PostRecord).reply === undefined;
	};
};

const createHideRepostsFilter = (): PostFilter => {
	return (item) => {
		return item.reason === undefined || item.reason.$type !== 'app.bsky.feed.defs#reasonRepost';
	};
};

const createHideQuotesFilter = (): PostFilter => {
	return (item) => {
		const record = item.post.record as PostRecord;
		const embed = record.embed;

		return (
			embed === undefined ||
			(embed.$type !== 'app.bsky.embed.record' && embed.$type !== 'app.bsky.embed.recordWithMedia')
		);
	};
};

//// Slice filters
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

const createHomeSliceFilter = (uid: DID, followsOnly: boolean): SliceFilter | undefined => {
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
				(rAuthor.did !== uid && ((followsOnly && !rViewer.following.peek()) || rViewer.muted.peek())) ||
				(pAuthor.did !== uid && ((followsOnly && !pViewer.following.peek()) || pViewer.muted.peek()))
			) {
				return yankReposts(items);
			}
		}

		return true;
	};
};

const createProfileSliceFilter = (did: DID): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		// skip any posts that are in reply to non-followed
		if (first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			const rAuthor = root.author;
			const pAuthor = parent.author;

			if (rAuthor.did !== did || pAuthor.did !== did) {
				return yankReposts(items);
			}
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

//// Miscellaneous
const resolveLanguages = (langs: string[], system: boolean) => {
	return system ? systemLanguages.concat(langs) : langs;
};
