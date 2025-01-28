import * as v from '@badrap/valita';
import emojiRegex from 'emoji-regex-xs';

import type { At } from '@atcute/client/lexicons';

import {
	type KeywordFilter,
	type KeywordFilterMatcher,
	type LabelPreference,
	type LabelPreferenceMapping,
	type ModerationService,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
} from '~/api/moderation';
import {
	FILTER_FOLLOWS,
	FILTER_LIKES,
	FILTER_MENTIONS,
	FILTER_QUOTES,
	FILTER_REPLIES,
	FILTER_REPOSTS,
} from '~/api/queries/get-notifications';

import {
	type DeckConfig,
	PANE_TYPE_FEED,
	PANE_TYPE_HOME,
	PANE_TYPE_LIST,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	PANE_TYPE_SEARCH,
	PANE_TYPE_THREAD,
	type PaneConfig,
	PaneSize,
	ProfilePaneTab,
	SpecificPaneSize,
} from '~/desktop/globals/panes';
import type { PreferencesSchema } from '~/desktop/globals/settings';

import { mapDefined } from '~/utils/misc';

import { createRegexMatcher } from '~/desktop/components/settings/settings-views/keyword-filters/KeywordFilterFormView';

const ATURI_RE =
	/^at:\/\/(did:[a-zA-Z0-9._:%-]+|[a-zA-Z0-9-.]+)\/([a-zA-Z0-9-.]+)\/((?!\.{1,2}$)[a-zA-Z0-9_~.:-]{1,512})(?:#(\/[a-zA-Z0-9._~:@!$&%')(*+,;=\-[\]/\\]*))?$/;
const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._:%-]*[a-zA-Z0-9._-]$/;
const HANDLE_RE = /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})$/;
const RECORD_KEY_RE = /^(?!\.{1,2}$)[a-zA-Z0-9_~.:-]{1,512}$/;
const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

const DECK_EMOJI_RE = new RegExp(`^(?:${emojiRegex().source})$`, 'u');

const atUriString = v.string().assert((str) => ATURI_RE.test(str), `expected at-uri`);
const didString = v.string().assert((str): str is At.DID => DID_RE.test(str), `expected did`);
const handleString = v.string().assert((str) => HANDLE_RE.test(str), `expected handle`);
const recordKeyString = v.string().assert((str) => RECORD_KEY_RE.test(str), `expected record key`);
const tidString = v.string().assert((str) => TID_RE.test(str), `expected tid`);
const urlString = v.string().assert((str) => URL.canParse(str), `expected url`);

const integer = v.number().assert((num) => Number.isSafeInteger(num) && num >= 0, `expected integer`);

const basePane = v.object({
	id: tidString,
	uid: didString,
	title: v.union(v.null(), v.string()),
	size: v.union(v.null(), v.literal('sm'), v.literal('md'), v.literal('lg')),
});

type BasePane = v.Infer<typeof basePane>;

const homePane = basePane.extend({
	type: v.literal('home'),
	showQuotes: v.boolean(),
	showReplies: v.union(v.boolean(), v.literal('follows')),
	showReposts: v.boolean(),
});

const notificationPane = basePane.extend({
	type: v.literal('notifications'),
	exclusions: v
		.array(
			v.union(
				v.literal('follows'),
				v.literal('likes'),
				v.literal('mentions'),
				v.literal('quotes'),
				v.literal('replies'),
				v.literal('reposts'),
			),
		)
		.chain((arr) => {
			for (let i = 0, len = arr.length; i < len; i++) {
				const val = arr[i];

				for (let j = 0; j < i; j++) {
					if (val === arr[j]) {
						return v.err({
							message: `duplicate "${val}" exclusion`,
							path: [i],
						});
					}
				}
			}

			return v.ok(arr);
		}),
});

type NotificationPane = v.Infer<typeof notificationPane>;

const profilePane = basePane.extend({
	type: v.literal('profile'),
	profile: v.object({
		did: didString,
		handle: handleString,
	}),
	tabs: v.object({
		visible: v.boolean(),
		cursor: v.union(
			v.literal('posts'),
			v.literal('posts_with_replies'),
			v.literal('media'),
			v.literal('likes'),
		),
	}),
});

type ProfilePane = v.Infer<typeof profilePane>;

const feedPane = basePane.extend({
	type: v.literal('feed'),
	feed: v.object({
		uri: atUriString.assert((str) => str.includes('/app.bsky.feed.generator/'), `expected feed uri`),
		name: v.string(),
	}),
	showQuotes: v.boolean(),
	showReplies: v.boolean(),
	showReposts: v.boolean(),
	infoVisible: v.boolean(),
});

const listPane = basePane.extend({
	type: v.literal('list'),
	list: v.object({
		uri: atUriString.assert((str) => str.includes('/app.bsky.graph.list/'), `expected list uri`),
		name: v.string(),
	}),
	showQuotes: v.boolean(),
	showReplies: v.boolean(),
	infoVisible: v.boolean(),
});

const searchPane = basePane.extend({
	type: v.literal('search'),
	query: v.string(),
	sort: v.union(v.literal('top'), v.literal('latest')),
});

const threadPane = basePane.extend({
	type: v.literal('thread'),
	thread: v.object({
		actor: didString,
		rkey: recordKeyString,
	}),
});

const pane = v.union(homePane, notificationPane, profilePane, feedPane, listPane, searchPane, threadPane);

type Pane = v.Infer<typeof pane>;

const deck = v.object({
	id: tidString,
	name: v.string(),
	emoji: v.string().assert((str) => DECK_EMOJI_RE.test(str)),
	panes: v.array(pane),
});

type Deck = v.Infer<typeof deck>;

const labelPref = v.union(v.literal('ignore'), v.literal('warn'), v.literal('hide'));

type LabelPref = v.Infer<typeof labelPref>;

const keywordFilterPref = v.union(v.literal('ignore'), v.literal('warn'), v.literal('hide'));

const modService = v.object({
	did: didString,

	profile: v.object({
		avatar: urlString.optional(),
		handle: handleString,
		displayName: v.string().optional(),
	}),

	redact: v.boolean(),
	prefs: v.record(labelPref),
});

type ModService = v.Infer<typeof modService>;

const wordFilter = v.object({
	id: tidString,
	name: v.string(),
	pref: keywordFilterPref,

	expires: v.union(v.null(), integer),
	matchers: v.array(v.object({ keyword: v.string(), whole: v.boolean() })),
	noFollows: v.boolean(),
});

type WordFilter = v.Infer<typeof wordFilter>;

const repostFilter = v.object({
	did: didString,
});

const tempMuteFilter = v.object({
	did: didString,
	expires: integer,
});

export const backupSchema = v.object({
	$version: v.literal(1),
	decks: v.array(deck).chain((arr) => {
		const paneIds = new Set<string>();

		for (let i = 0, len = arr.length; i < len; i++) {
			const deck = arr[i];

			const deckId = deck.id;
			for (let j = 0; j < i; j++) {
				if (deckId === arr[j].id) {
					return v.err({
						message: `duplicate deck id "${deckId}"`,
						path: [i, 'id'],
					});
				}
			}

			const panes = deck.panes;
			for (let j = 0, jlen = panes.length; j < jlen; j++) {
				const pane = panes[j];

				const paneId = pane.id;
				if (paneIds.has(paneId)) {
					return v.err({
						message: `duplicate pane id "${paneId}"`,
						path: [i, 'panes', j, 'id'],
					});
				}

				paneIds.add(paneId);
			}
		}

		return v.ok(arr);
	}),
	ui: v.object({
		theme: v.union(v.literal('auto'), v.literal('dark'), v.literal('light')),
		defaultPaneSize: v.union(v.literal('sm'), v.literal('md'), v.literal('lg')),
		profileMediaGrid: v.boolean(),
		threadedReplies: v.boolean(),
		defaultReplyGate: v.union(v.literal('everyone'), v.literal('mentioned'), v.literal('followed')),
	}),
	a11y: v.object({
		warnNoMediaAlt: v.boolean(),
	}),
	moderation: v.object({
		global: v.object({
			prefs: v.record(labelPref),
		}),
		services: v.array(modService).chain((arr) => {
			for (let i = 0, len = arr.length; i < len; i++) {
				const service = arr[i];
				const did = service.did;

				for (let j = 0; j < i; j++) {
					if (did === arr[j].did) {
						return v.err({
							message: `duplicate moderation service "${did}"`,
							path: [i, 'did'],
						});
					}
				}
			}

			return v.ok(arr);
		}),

		keywords: v.array(wordFilter).chain((arr) => {
			for (let i = 0, len = arr.length; i < len; i++) {
				const filter = arr[i];
				const id = filter.id;

				for (let j = 0; j < i; j++) {
					if (id === arr[j].id) {
						return v.err({
							message: `duplicate keyword filter "${id}"`,
							path: [i, 'id'],
						});
					}
				}
			}

			return v.ok(arr);
		}),

		hideReposts: v.array(repostFilter).chain((arr) => {
			for (let i = 0, len = arr.length; i < len; i++) {
				const did = arr[i].did;

				for (let j = 0; j < i; j++) {
					if (did === arr[j].did) {
						return v.err({
							message: `duplicate "${did}" filter`,
							path: [i, 'did'],
						});
					}
				}
			}

			return v.ok(arr);
		}),
		tempMutes: v.array(tempMuteFilter).chain((arr) => {
			for (let i = 0, len = arr.length; i < len; i++) {
				const did = arr[i].did;

				for (let j = 0; j < i; j++) {
					if (did === arr[j].did) {
						return v.err({
							message: `duplicate "${did}" filter`,
							path: [i, 'did'],
						});
					}
				}
			}

			return v.ok(arr);
		}),
	}),
	language: v.object({
		languages: v.array(v.string()),
		useSystemLanguages: v.boolean(),
		defaultPostLanguage: v.string(),
		allowUnspecified: v.boolean(),
	}),
	translation: v.object({
		to: v.string(),
		exclusions: v.array(v.string()),
	}),
});

type Backup = v.Infer<typeof backupSchema>;

const fromBackupPaneSize = (size: Backup['ui']['defaultPaneSize']): PaneSize => {
	switch (size) {
		case 'sm':
			return PaneSize.SMALL;
		case 'md':
			return PaneSize.MEDIUM;
		case 'lg':
			return PaneSize.LARGE;
	}
};

const toBackupPaneSize = (size: PaneSize): Backup['ui']['defaultPaneSize'] => {
	switch (size) {
		case PaneSize.SMALL:
			return 'sm';
		case PaneSize.MEDIUM:
			return 'md';
		case PaneSize.LARGE:
			return 'lg';
	}
};

const fromBackupReplyGate = (
	gate: Backup['ui']['defaultReplyGate'],
): PreferencesSchema['ui']['defaultReplyGate'] => {
	switch (gate) {
		case 'everyone':
			return 'e';
		case 'followed':
			return 'f';
		case 'mentioned':
			return 'm';
	}
};

const toBackupReplyGate = (
	gate: PreferencesSchema['ui']['defaultReplyGate'],
): Backup['ui']['defaultReplyGate'] => {
	switch (gate) {
		case 'e':
			return 'everyone';
		case 'f':
			return 'followed';
		case 'm':
			return 'mentioned';
	}
};

const fromBackupSpecificPaneSize = (size: BasePane['size']): SpecificPaneSize => {
	switch (size) {
		case null:
			return SpecificPaneSize.INHERIT;
		case 'sm':
			return SpecificPaneSize.SMALL;
		case 'md':
			return SpecificPaneSize.MEDIUM;
		case 'lg':
			return SpecificPaneSize.LARGE;
	}
};

const toBackupSpecificPaneSize = (size: SpecificPaneSize): BasePane['size'] => {
	switch (size) {
		case SpecificPaneSize.INHERIT:
			return null;
		case SpecificPaneSize.SMALL:
			return 'sm';
		case SpecificPaneSize.MEDIUM:
			return 'md';
		case SpecificPaneSize.LARGE:
			return 'lg';
	}
};

const fromBackupProfileTab = (tab: ProfilePane['tabs']['cursor']): ProfilePaneTab => {
	switch (tab) {
		case 'likes':
			return ProfilePaneTab.LIKES;
		case 'media':
			return ProfilePaneTab.MEDIA;
		case 'posts':
			return ProfilePaneTab.POSTS;
		case 'posts_with_replies':
			return ProfilePaneTab.POSTS_WITH_REPLIES;
	}
};

const toBackupProfileTab = (tab: ProfilePaneTab): ProfilePane['tabs']['cursor'] => {
	switch (tab) {
		case ProfilePaneTab.LIKES:
			return 'likes';
		case ProfilePaneTab.MEDIA:
			return 'media';
		case ProfilePaneTab.POSTS:
			return 'posts';
		case ProfilePaneTab.POSTS_WITH_REPLIES:
			return 'posts_with_replies';
	}
};

const fromBackupPane = (pane: Pane): PaneConfig => {
	switch (pane.type) {
		case 'home': {
			return {
				type: PANE_TYPE_HOME,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				showReplies: pane.showReplies,
				showReposts: pane.showReposts,
				showQuotes: pane.showQuotes,
			};
		}
		case 'notifications': {
			const exclusions = new Set(pane.exclusions);

			let mask = 0;
			if (exclusions.has('follows')) {
				mask |= FILTER_FOLLOWS;
			}
			if (exclusions.has('likes')) {
				mask |= FILTER_LIKES;
			}
			if (exclusions.has('mentions')) {
				mask |= FILTER_MENTIONS;
			}
			if (exclusions.has('quotes')) {
				mask |= FILTER_QUOTES;
			}
			if (exclusions.has('replies')) {
				mask |= FILTER_REPLIES;
			}
			if (exclusions.has('reposts')) {
				mask |= FILTER_REPOSTS;
			}

			return {
				type: PANE_TYPE_NOTIFICATIONS,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				mask: mask,
			};
		}
		case 'profile': {
			return {
				type: PANE_TYPE_PROFILE,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				profile: {
					did: pane.profile.did,
					handle: pane.profile.handle,
				},
				tab: fromBackupProfileTab(pane.tabs.cursor),
				tabVisible: pane.tabs.visible,
			};
		}
		case 'feed': {
			return {
				type: PANE_TYPE_FEED,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				feed: {
					uri: pane.feed.uri,
					name: pane.feed.name,
				},
				showReplies: pane.showReplies,
				showReposts: pane.showReposts,
				showQuotes: pane.showQuotes,
				infoVisible: pane.infoVisible,
			};
		}
		case 'list': {
			return {
				type: PANE_TYPE_LIST,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				list: {
					uri: pane.list.uri,
					name: pane.list.name,
				},
				showReplies: pane.showReplies,
				showQuotes: pane.showQuotes,
				infoVisible: pane.infoVisible,
			};
		}
		case 'search': {
			return {
				type: PANE_TYPE_SEARCH,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				query: pane.query,
				sort: pane.sort,
			};
		}
		case 'thread': {
			return {
				type: PANE_TYPE_THREAD,

				id: pane.id,
				title: pane.title,
				size: fromBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				thread: {
					actor: pane.thread.actor,
					rkey: pane.thread.rkey,
				},
			};
		}
	}
};

const toBackupPane = (pane: PaneConfig): Pane => {
	switch (pane.type) {
		case PANE_TYPE_HOME: {
			return {
				type: 'home',

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				showReplies: pane.showReplies,
				showReposts: pane.showReposts,
				showQuotes: pane.showQuotes,
			};
		}
		case PANE_TYPE_NOTIFICATIONS: {
			const mask = pane.mask;
			const exclusions: NotificationPane['exclusions'] = [];

			if (mask & FILTER_FOLLOWS) {
				exclusions.push('follows');
			}
			if (mask & FILTER_LIKES) {
				exclusions.push('likes');
			}
			if (mask & FILTER_MENTIONS) {
				exclusions.push('mentions');
			}
			if (mask & FILTER_QUOTES) {
				exclusions.push('quotes');
			}
			if (mask & FILTER_REPLIES) {
				exclusions.push('replies');
			}
			if (mask & FILTER_REPOSTS) {
				exclusions.push('reposts');
			}

			return {
				type: PANE_TYPE_NOTIFICATIONS,

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				exclusions: exclusions,
			};
		}
		case PANE_TYPE_PROFILE: {
			return {
				type: 'profile',

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				profile: {
					did: pane.profile.did,
					handle: pane.profile.handle,
				},
				tabs: {
					visible: pane.tabVisible,
					cursor: toBackupProfileTab(pane.tab),
				},
			};
		}
		case PANE_TYPE_FEED: {
			return {
				type: PANE_TYPE_FEED,

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				feed: {
					uri: pane.feed.uri,
					name: pane.feed.name,
				},
				showReplies: pane.showReplies,
				showReposts: pane.showReposts,
				showQuotes: pane.showQuotes,
				infoVisible: pane.infoVisible,
			};
		}
		case PANE_TYPE_LIST: {
			return {
				type: PANE_TYPE_LIST,

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				list: {
					uri: pane.list.uri,
					name: pane.list.name,
				},
				showReplies: pane.showReplies,
				showQuotes: pane.showQuotes,
				infoVisible: pane.infoVisible,
			};
		}
		case PANE_TYPE_SEARCH: {
			return {
				type: 'search',

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				query: pane.query,
				sort: pane.sort,
			};
		}
		case PANE_TYPE_THREAD: {
			return {
				type: 'thread',

				id: pane.id,
				title: pane.title,
				size: toBackupSpecificPaneSize(pane.size),
				uid: pane.uid,

				thread: {
					actor: pane.thread.actor,
					rkey: pane.thread.rkey,
				},
			};
		}
	}
};

const fromBackupDeck = (deck: Deck): DeckConfig => {
	return {
		id: deck.id,
		name: deck.name,
		emoji: deck.emoji,
		panes: deck.panes.map(fromBackupPane),
	};
};

const toBackupDeck = (deck: DeckConfig): Deck => {
	return {
		id: deck.id,
		name: deck.name,
		emoji: deck.emoji,
		panes: deck.panes.map(toBackupPane),
	};
};

const fromBackupLabelPref = (pref: LabelPref): LabelPreference => {
	switch (pref) {
		case 'ignore': {
			return PreferenceIgnore;
		}
		case 'warn': {
			return PreferenceWarn;
		}
		case 'hide': {
			return PreferenceHide;
		}
	}
};

const toBackupLabelPref = (pref: LabelPreference): LabelPref => {
	switch (pref) {
		case PreferenceIgnore: {
			return 'ignore';
		}
		case PreferenceWarn: {
			return 'warn';
		}
		case PreferenceHide: {
			return 'hide';
		}
	}
};

const fromBackupLabelPrefMapping = (prefs: ModService['prefs']): LabelPreferenceMapping => {
	const next: LabelPreferenceMapping = {};

	for (const label in prefs) {
		const val = prefs[label];
		next[val] = fromBackupLabelPref(val);
	}

	return next;
};

const toBackupLabelPrefMapping = (prefs: LabelPreferenceMapping): ModService['prefs'] => {
	const next: ModService['prefs'] = {};

	for (const label in prefs) {
		const val = prefs[label];
		if (val === undefined) {
			continue;
		}

		next[val] = toBackupLabelPref(val);
	}

	return next;
};

const fromBackupModService = (service: ModService): ModerationService => {
	return {
		did: service.did,
		redact: service.redact ?? false,
		profile: {
			avatar: service.profile.avatar,
			handle: service.profile.handle,
			displayName: service.profile.displayName,
		},
		prefs: fromBackupLabelPrefMapping(service.prefs),
		vals: [],
		defs: {},
	};
};

const toBackupModService = (service: ModerationService): ModService => {
	return {
		did: service.did,
		profile: {
			avatar: service.profile.avatar,
			handle: service.profile.handle,
			displayName: service.profile.displayName,
		},
		redact: service.redact ?? false,
		prefs: toBackupLabelPrefMapping(service.prefs),
	};
};

const fromBackupWordFilter = (filter: WordFilter): KeywordFilter => {
	const matchers = filter.matchers.map((match): KeywordFilterMatcher => [match.keyword, match.whole]);

	return {
		id: filter.id,
		name: filter.name,

		pref: fromBackupLabelPref(filter.pref),
		expires: filter.expires ?? undefined,

		noFollows: filter.noFollows,
		matchers: matchers,

		match: createRegexMatcher(matchers),
	};
};

const toBackupWordFilter = (filter: KeywordFilter): WordFilter => {
	return {
		id: filter.id,
		name: filter.name,

		pref: toBackupLabelPref(filter.pref),
		expires: filter.expires ?? null,

		noFollows: filter.noFollows,
		matchers: filter.matchers.map(([keyword, whole]) => ({ keyword, whole })),
	};
};

export const fromBackup = (data: Backup, isOnboarding: boolean): PreferencesSchema => {
	return {
		$version: 13,
		onboarding: isOnboarding,
		decks: data.decks.map(fromBackupDeck),
		ui: {
			defaultPaneSize: fromBackupPaneSize(data.ui.defaultPaneSize),
			defaultReplyGate: fromBackupReplyGate(data.ui.defaultReplyGate),
			profileMediaGrid: data.ui.profileMediaGrid,
			theme: data.ui.theme,
			threadedReplies: data.ui.threadedReplies,
		},
		a11y: {
			warnNoMediaAlt: data.a11y.warnNoMediaAlt,
		},
		moderation: {
			updatedAt: 0,
			hideReposts: data.moderation.hideReposts.map((filter) => filter.did),
			keywords: data.moderation.keywords.map(fromBackupWordFilter),
			labels: fromBackupLabelPrefMapping(data.moderation.global.prefs),
			services: data.moderation.services.map(fromBackupModService),
			tempMutes: Object.fromEntries(data.moderation.tempMutes.map((filter) => [filter.did, filter.expires])),
		},
		language: {
			allowUnspecified: data.language.allowUnspecified,
			defaultPostLanguage: data.language.defaultPostLanguage,
			languages: data.language.languages,
			useSystemLanguages: data.language.useSystemLanguages,
		},
		translation: {
			exclusions: data.translation.exclusions,
			to: data.translation.to,
		},
	};
};

export const toBackup = (data: PreferencesSchema): Backup => {
	return {
		$version: 1,
		decks: data.decks.map(toBackupDeck),
		ui: {
			defaultPaneSize: toBackupPaneSize(data.ui.defaultPaneSize),
			defaultReplyGate: toBackupReplyGate(data.ui.defaultReplyGate),
			profileMediaGrid: data.ui.profileMediaGrid,
			theme: data.ui.theme,
			threadedReplies: data.ui.threadedReplies,
		},
		a11y: {
			warnNoMediaAlt: data.a11y.warnNoMediaAlt,
		},
		moderation: {
			hideReposts: data.moderation.hideReposts.map((did) => ({ did })),
			keywords: data.moderation.keywords.map(toBackupWordFilter),
			global: { prefs: toBackupLabelPrefMapping(data.moderation.labels) },
			services: data.moderation.services.map(toBackupModService),
			tempMutes: mapDefined(Object.entries(data.moderation.tempMutes), ([did, expires]) => {
				if (expires !== undefined) {
					return { did: did as At.DID, expires };
				}
			}),
		},
		language: {
			allowUnspecified: data.language.allowUnspecified,
			defaultPostLanguage: data.language.defaultPostLanguage,
			languages: data.language.languages,
			useSystemLanguages: data.language.useSystemLanguages,
		},
		translation: {
			exclusions: data.translation.exclusions,
			to: data.translation.to,
		},
	};
};
