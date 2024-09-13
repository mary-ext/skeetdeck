import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { assert } from '~/utils/misc';

import type { AppBskyFeedGetTimeline, AppBskyFeedPost, At } from '../atp-schema';
import type { AgentInstance } from '../classes/multiagent';
import { multiagent } from '../globals/agent';
import { systemLanguages } from '../globals/platform';
import {
	type PostFilter,
	type SignalizedTimelineItem,
	type SliceFilter,
	type TimelineSlice,
	createTimelineSlices,
	createUnjoinedSlices,
} from '../models/timeline';
import {
	ContextContentList,
	type ModerationCause,
	type ModerationOptions,
	PreferenceHide,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
	getModerationUI,
} from '../moderation';
import type { LanguagePreferences } from '../types';
import { unwrapPostEmbedText } from '../utils/post';
import { wrapInfiniteQuery } from '../utils/query';

import _getDid from './_did';

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
	actor: At.DID;
	tab: 'posts' | 'replies' | 'likes' | 'media';
}

export interface SearchTimelineParams {
	type: 'search';
	query: string;
	sort: 'top' | 'latest';
}

export type TimelineParams =
	| FeedTimelineParams
	| HomeTimelineParams
	| ListTimelineParams
	| ProfileTimelineParams
	| SearchTimelineParams;

export interface TimelinePage {
	cursor: string | undefined;
	cid: string | undefined;
	slices: TimelineSlice[];
}

export interface TimelineLatestResult {
	cid: string | undefined;
}

type PostRecord = AppBskyFeedPost.Record;

//// Feed query
const MAX_POSTS = 50;

export const getTimelineKey = (uid: At.DID, params: TimelineParams, limit = MAX_POSTS) => {
	return ['getTimeline', uid, params, limit] as const;
};
export const getTimeline = wrapInfiniteQuery(
	async (ctx: QC<ReturnType<typeof getTimelineKey>, string | undefined>) => {
		const [, uid, params, limit] = ctx.queryKey;

		const { language, moderation } = ctx.meta || {};

		const type = params.type;

		const agent = await multiagent.connect(uid);

		let sliceFilter: SliceFilter | undefined | null;
		let postFilter: PostFilter | undefined;

		if (type === 'home') {
			sliceFilter = createHomeSliceFilter(uid, params.showReplies === 'follows');

			postFilter = combine([
				createHiddenRepostFilter(moderation),
				createDuplicatePostFilter(),

				!params.showReplies && createHideRepliesFilter(),
				!params.showQuotes && createHideQuotesFilter(),
				!params.showReposts && createHideRepostsFilter(),

				createInvalidReplyFilter(),
				createLabelPostFilter(moderation),
				createTempMutePostFilter(uid, moderation),
			]);
		} else if (type === 'feed' || type === 'list') {
			sliceFilter = createFeedSliceFilter();
			postFilter = combine([
				type === 'feed' && createHiddenRepostFilter(moderation),
				createDuplicatePostFilter(),

				!params.showReplies && createHideRepliesFilter(),
				!params.showQuotes && createHideQuotesFilter(),
				type === 'feed' && !params.showReposts && createHideRepostsFilter(),

				createLanguagePostFilter(language),
				createLabelPostFilter(moderation),
				createTempMutePostFilter(uid, moderation),
			]);
		} else if (type === 'profile') {
			postFilter = createLabelPostFilter(moderation);

			if (params.tab === 'posts') {
				const did = await _getDid(agent.rpc, params.actor);
				sliceFilter = createProfileSliceFilter(did);
				postFilter = combine([createInvalidReplyFilter(), createLabelPostFilter(moderation)]);
			} else if (params.tab === 'likes' || params.tab === 'media') {
				sliceFilter = null;
			}
		} else {
			postFilter = createLabelPostFilter(moderation);
		}

		const timeline = await fetchPage(agent, params, limit, ctx.pageParam, ctx);

		const feed = timeline.feed;
		const result =
			sliceFilter !== null
				? createTimelineSlices(uid, feed, sliceFilter, postFilter)
				: createUnjoinedSlices(uid, feed, postFilter);

		const page: TimelinePage = {
			cursor: timeline.cursor,
			cid: feed.length > 0 ? feed[0].post.cid : undefined,
			slices: result,
		};

		return page;
	},
);

/// Latest feed query
export const getTimelineLatestKey = (uid: At.DID, params: TimelineParams) => {
	return ['getTimelineLatest', uid, params] as const;
};
export const getTimelineLatest = async (ctx: QC<ReturnType<typeof getTimelineLatestKey>>) => {
	const [, uid, params] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const timeline = await fetchPage(agent, params, 1, undefined, ctx);
	const feed = timeline.feed;

	return { cid: feed.length > 0 ? feed[0].post.cid : undefined };
};

//// Raw fetch
const fetchPage = async (
	{ rpc }: AgentInstance,
	params: TimelineParams,
	limit: number,
	cursor: string | undefined,
	context: QC,
): Promise<AppBskyFeedGetTimeline.Output> => {
	const type = params.type;
	const signal = context.signal;

	let headers: Record<string, string> | undefined;
	if (context.meta?.language) {
		const prefs = context.meta.language;
		const langs = resolveLanguages(prefs.languages, prefs.useSystemLanguages);

		headers = { ['accept-language']: langs.join(',') };
	}

	if (type === 'home') {
		const response = await rpc.get('app.bsky.feed.getTimeline', {
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
		const response = await rpc.get('app.bsky.feed.getFeed', {
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
		const response = await rpc.get('app.bsky.feed.getListFeed', {
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
			const response = await rpc.get('app.bsky.feed.getActorLikes', {
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
			const response = await rpc.get('app.bsky.feed.getAuthorFeed', {
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
		const response = await rpc.get('app.bsky.feed.searchPosts', {
			signal: signal,
			params: {
				sort: params.sort,
				q: params.query,
				cursor: cursor,
				limit: limit,
			},
		});

		const data = response.data;

		return { cursor: data.cursor, feed: data.posts.map((view) => ({ post: view })) };
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
const createDuplicatePostFilter = (): PostFilter => {
	const map: Record<string, boolean> = {};

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
		// Don't allow posts that isn't being a hydrated with a reply when it should
		return (
			// Allow posts with a timeline reply attached
			item.reply !== undefined ||
			// Allow posts whose record doesn't have the reply object
			(item.post.record as PostRecord).reply === undefined
		);
	};
};

const createLabelPostFilter = (opts?: ModerationOptions): PostFilter | undefined => {
	if (!opts) {
		return;
	}

	return (item) => {
		const post = item.post;

		const author = post.author;
		const record = post.record as PostRecord;

		const isFollowing = !!author.viewer?.following;
		const text = record.text + unwrapPostEmbedText(record.embed);

		record.embed;

		const accu: ModerationCause[] = [];
		decideLabelModeration(accu, TargetContent, post.labels, post.author.did, opts);
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceHide, opts);

		const decision = getModerationUI(accu, ContextContentList);

		return decision.f.length === 0;
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

		return langs.some((code) => {
			const idx = code.indexOf('-');
			const lng = idx === -1 ? code : code.slice(0, idx);

			return languages.includes(lng);
		});
	};
};

const createHiddenRepostFilter = (prefs?: ModerationOptions): PostFilter | undefined => {
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

const createTempMutePostFilter = (
	uid: At.DID,
	prefs: ModerationOptions | undefined,
): PostFilter | undefined => {
	if (!prefs) {
		return;
	}

	const mutes = prefs.tempMutes;

	if (Object.keys(mutes).length === 0) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		if (reason) {
			const did = reason.by.did;

			if (did !== uid && mutes![did]) {
				return false;
			}
		}

		const did = item.post.author.did;

		if (did !== uid && mutes![did]) {
			return false;
		}

		return true;
	};
};

const createHideRepliesFilter = (): PostFilter => {
	return (item) => {
		const reason = item.reason;

		return (
			// Allow reposts
			(reason !== undefined && reason.$type === 'app.bsky.feed.defs#reasonRepost') ||
			// Allow posts that aren't a reply
			(item.reply === undefined && (item.post.record as PostRecord).reply === undefined)
		);
	};
};

const createHideRepostsFilter = (): PostFilter => {
	return (item) => {
		const reason = item.reason;

		// Allow posts with no reason, or the reasoning isn't a repost.
		return reason === undefined || reason.$type !== 'app.bsky.feed.defs#reasonRepost';
	};
};

const createHideQuotesFilter = (): PostFilter => {
	return (item) => {
		const record = item.post.record as PostRecord;
		const embed = record.embed;

		return (
			// Allow posts with no embeds
			embed === undefined ||
			// Allow posts whose embeds aren't a record
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

const createHomeSliceFilter = (uid: At.DID, followsOnly: boolean): SliceFilter | undefined => {
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

const createProfileSliceFilter = (did: At.DID): SliceFilter | undefined => {
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
