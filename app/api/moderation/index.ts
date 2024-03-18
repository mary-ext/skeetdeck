import type { At, ComAtprotoLabelDefs } from '../atp-schema';

type Label = ComAtprotoLabelDefs.Label;

/** Ignore this label */
export const PreferenceIgnore = 1;
/** Warn when viewing content with this label present */
export const PreferenceWarn = 2;
/** Hide content if this label is present */
export const PreferenceHide = 3;

export type LabelPreference = 1 | 2 | 3;
export type KeywordPreference = 1 | 2 | 3;

/** Don't blur any parts of the content */
export const BlurNone = 0;
/** Only blur the media present in the content */
export const BlurMedia = 1;
/** Blur the entire content */
export const BlurContent = 2;

export type LabelBlur = 0 | 1 | 2;

/** Don't inform the user */
export const SeverityNone = 0;
/** Lightly inform the user about this label's presence */
export const SeverityInform = 1;
/** Alert the user about this label's presence */
export const SeverityAlert = 2;

export type LabelSeverity = 0 | 1 | 2;

/** No flags are present */
export const FlagsNone = 0;
/** Don't allow blurred content to be expanded */
export const FlagsForced = 1 << 0;
/** Don't apply label to self */
export const FlagsNoSelf = 1 << 1;
/** Label is adult-only. */
export const FlagsAdultOnly = 1 << 2;

/** Label is intended for content */
export const TargetContent = 0;
/** Label is intended for profile */
export const TargetProfile = 1;

export type LabelTarget = 0 | 1;

export const ContextContentView = 0;
export const ContextContentMedia = 1;
export const ContextContentList = 2;
export const ContextProfileView = 3;
export const ContextProfileMedia = 4;
export const ContextProfileList = 5;

export type ModerationContext = 0 | 1 | 2 | 3 | 4 | 5;

export interface LabelLocale {
	/** Locale code */
	i: string;
	/** Label name */
	n: string;
	/** Label description */
	d: string;
}

export interface LabelDefinition {
	/** Label identifier */
	i: string;
	/** Default preference value */
	d: LabelPreference;
	/** How the content should be blurred */
	b: LabelBlur;
	/** How the content should be informed */
	s: LabelSeverity;
	/** Additional flags for the label */
	f: number;
	/** Descriptions for the label */
	l: LabelLocale[];
}

export type LabelDefinitionMapping = Record<string, LabelDefinition>;
export type LabelPreferenceMapping = Record<string, LabelPreference | undefined>;

export const GLOBAL_LABELS: LabelDefinitionMapping = {
	'!hide': {
		i: '!hide',
		d: PreferenceHide,
		b: BlurContent,
		s: SeverityNone,
		f: FlagsForced | FlagsNoSelf,
		l: [{ i: 'en', n: `Hidden by moderators`, d: `` }],
	},
	'!warn': {
		i: '!warn',
		d: PreferenceWarn,
		b: BlurNone,
		s: SeverityAlert,
		f: FlagsNoSelf,
		l: [{ i: 'en', n: `Content warning`, d: `` }],
	},
	porn: {
		i: 'porn',
		d: PreferenceWarn,
		b: BlurMedia,
		s: SeverityNone,
		f: FlagsAdultOnly,
		l: [{ i: 'en', n: `Pornography`, d: `Erotic nudity or explicit sexual activity` }],
	},
	sexual: {
		i: 'sexual',
		d: PreferenceWarn,
		b: BlurMedia,
		s: SeverityNone,
		f: FlagsAdultOnly,
		l: [{ i: 'en', n: `Sexually suggestive`, d: `Not pornographic but sexual in nature` }],
	},
	'graphic-media': {
		i: 'graphic-media',
		d: PreferenceWarn,
		b: BlurMedia,
		s: SeverityNone,
		f: FlagsAdultOnly,
		l: [{ i: 'en', n: `Graphic media`, d: `Disturbing content` }],
	},
	nudity: {
		i: 'nudity',
		d: PreferenceIgnore,
		b: BlurMedia,
		s: SeverityNone,
		f: FlagsNone,
		l: [{ i: 'en', n: `Nudity`, d: `Artistic or non-erotic nudity` }],
	},
};

export const getLocalizedLabel = (label: LabelDefinition): LabelLocale => {
	// Get English definitions first before giving up
	const locales = label.l;

	return locales.length > 0
		? locales.find(({ i }) => i.split('-')[0] === 'en') || locales[0]
		: { i: 'en', n: `Flagged: ${label.i}`, d: `` };
};

export const CauseLabel = 0;
export const CauseMutedPermanent = 1;
export const CauseMutedTemporary = 2;
export const CauseMutedKeyword = 3;

export type ModerationCauseType = 0 | 1 | 2 | 3;

interface BaseModerationCause {
	/** Cause type */
	t: ModerationCauseType;
	/** Cause priority */
	p: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

export interface LabelModerationCause {
	t: typeof CauseLabel;
	p: 1 | 2 | 5 | 7 | 8;

	/** Target of the label */
	k: LabelTarget;

	/** Label source */
	s: ModerationService | undefined;
	/** Label object */
	l: Label;
	/** Label definition */
	d: LabelDefinition;
	/** User-set preference for this label */
	v: LabelPreference;
}

export interface MutedPermanentModerationCause extends BaseModerationCause {
	t: typeof CauseMutedPermanent;
	p: 6;
}

export interface MutedTemporaryModerationCause extends BaseModerationCause {
	t: typeof CauseMutedTemporary;
	p: 6;

	/** Temporary mute duration */
	d: number;
}

export interface MutedKeywordModerationCause extends BaseModerationCause {
	t: typeof CauseMutedKeyword;
	p: 6;

	/** Name of keyword muting in effect */
	n: string;
	/** User's set preference for this cause */
	v: KeywordPreference;
}

export type ModerationCause =
	| LabelModerationCause
	| MutedPermanentModerationCause
	| MutedTemporaryModerationCause
	| MutedKeywordModerationCause;

export type KeywordFilterMatcher = [keyword: string, whole: boolean];

export interface KeywordFilter {
	// Only these properties are ever used during actual filtering
	name: string;
	pref: KeywordPreference;
	match: string;
	noFollows: boolean;

	// These are used in the preferences UI
	id: string;
	matchers: KeywordFilterMatcher[];
}

export interface ServiceProfile {
	avatar?: string;
	handle: string;
	displayName?: string;
	description?: string;
	indexedAt?: number;
}

export interface ModerationService {
	/** DID of the service */
	did: At.DID;
	/** Whether it should apply takedowns from this service */
	redact?: boolean;
	/** Information about this service */
	profile: ServiceProfile;
	/** Preferences for service-defined labels */
	prefs: LabelPreferenceMapping;
	/** Labels that this service claims to provide */
	vals: string[];
	/** Labels defined by this service */
	defs: LabelDefinitionMapping;
	/** Record indexed at */
	indexedAt?: number;
	/** Wasn't found during automatic update */
	deleted?: boolean;
}

export interface ModerationOptions {
	_filtersCache?: [raw: string, match: RegExp][];

	/** Preferences for global-defined labels */
	labels: LabelPreferenceMapping;
	/** Service options */
	services: ModerationService[];
	/** Keyword filters */
	keywords: KeywordFilter[];

	/** Hide reposts by these users from the timeline */
	hideReposts: At.DID[];
	/** Temporarily hide posts by these users from the timeline */
	tempMutes: { [user: At.DID]: number | undefined };
}

export const decideLabelModeration = (
	accu: ModerationCause[],
	target: LabelTarget,
	labels: Label[] | undefined,
	userDid: At.DID,
	opts: ModerationOptions,
) => {
	if (labels /* && labels.length > 0 */) {
		const globalPrefs = opts.labels;
		const services = Object.fromEntries(opts.services.map((service) => [service.did, service]));

		// labels.sort((a, b) => {
		// 	const aSelf = a.src === userDid;
		// 	const bSelf = b.src === userDid;
		// 	return aSelf === bSelf ? 0 : aSelf ? -1 : 1;
		// });

		for (let i = 0, il = labels.length; i < il; i++) {
			const label = labels[i];

			const val = label.val;
			const src = label.src;

			const isSelfLabeled = src === userDid;
			const isSystem = val[0] === '!';

			let service: ModerationService | undefined = services[src];
			let def: LabelDefinition | undefined = GLOBAL_LABELS[val];

			if (!isSystem && service && val in service.defs) {
				def = service.defs[val];
			}

			if (!def || (isSelfLabeled && def.f & FlagsNoSelf)) {
				continue;
			}

			const pref = (service ? service.prefs : globalPrefs)[val] ?? def.d;
			if (pref !== PreferenceHide && pref !== PreferenceWarn) {
				continue;
			}

			let prio: LabelModerationCause['p'];
			if (def.f & FlagsForced) {
				prio = 1;
			} else if (pref === PreferenceHide) {
				prio = 2;
			} else if (def.b === BlurContent) {
				prio = def.f & FlagsAdultOnly ? 5 : 7;
			} else if (def.b === BlurMedia) {
				prio = 7;
			} else {
				if (def.s === SeverityNone) {
					continue;
				}

				prio = 8;
			}

			accu.push({
				t: CauseLabel,
				p: prio,

				k: target,

				s: service,
				l: label,
				d: def,
				v: pref,
			});
		}
	}
};

export const decideMutedPermanentModeration = (accu: ModerationCause[], muted: boolean | undefined) => {
	if (muted) {
		accu.push({ t: CauseMutedPermanent, p: 6 });
	}
};

export const decideMutedTemporaryModeration = (
	accu: ModerationCause[],
	userDid: At.DID,
	opts: ModerationOptions,
) => {
	const duration = isProfileTempMuted(opts, userDid);

	if (duration != null) {
		accu.push({ t: CauseMutedTemporary, p: 6, d: duration });
	}
};

const shouldAllowKeywordFilter = (filterPref: KeywordPreference, pref: KeywordPreference) => {
	if (pref === PreferenceWarn) {
		return filterPref === pref || filterPref === PreferenceHide;
	}

	if (pref === PreferenceHide) {
		return filterPref === pref;
	}

	return false;
};

export const decideMutedKeywordModeration = (
	accu: ModerationCause[],
	text: string,
	following: boolean,
	pref: KeywordPreference,
	opts: ModerationOptions,
) => {
	const filters = opts.keywords;

	let cache = opts._filtersCache;
	let init = true;

	for (let idx = 0, len = filters.length; idx < len; idx++) {
		const filter = filters[idx];

		if (!shouldAllowKeywordFilter(filter.pref, pref) || (following && filter.noFollows)) {
			continue;
		}

		if (init) {
			if (cache) {
				cache.length = len;
			} else {
				cache = opts._filtersCache = new Array(len);
			}

			init = !init;
		}

		let match = filter.match;

		let matcher: RegExp;
		let cachedMatcher = cache![idx];

		if (!cachedMatcher || cachedMatcher[0] !== match) {
			cache![idx] = [match, (matcher = new RegExp(match, 'i'))];
		} else {
			matcher = cachedMatcher[1];
		}

		if (matcher.test(text)) {
			accu.push({ t: CauseMutedKeyword, p: 6, n: filter.name, v: pref });
		}
	}

	return accu;
};

export interface ModerationDecision {
	/** Whether it's overridable */
	o: boolean;

	/** Filters */
	f: ModerationCause[];
	/** Blurs */
	b: ModerationCause[];
	/** Alerts */
	a: ModerationCause[];
	/** Informs */
	i: ModerationCause[];
}

export const finalizeModeration = (
	causes: ModerationCause[],
	context: ModerationContext,
): ModerationDecision => {
	const filters: ModerationCause[] = [];
	const blurs: ModerationCause[] = [];
	const alerts: ModerationCause[] = [];
	const informs: ModerationCause[] = [];

	let overridable = true;

	for (let i = 0, il = causes.length; i < il; i++) {
		const cause = causes[i];
		const type = cause.t;

		if (type === CauseLabel) {
			const target = cause.k;
			const def = cause.d;

			const flags = def.f;
			const blur = def.b;
			const severity = def.s;

			if (cause.v === PreferenceHide) {
				if (
					(context === ContextProfileList && target === TargetProfile) ||
					(context === ContextContentList && (target === TargetContent || target === TargetProfile))
				) {
					filters.push(cause);
				}
			}

			if (blur === BlurContent) {
				if (context === ContextContentList || (context === ContextContentView && flags & FlagsAdultOnly)) {
					blurs.push(cause);

					if (flags & FlagsForced) {
						overridable = false;
					}
				} else if (severity === SeverityAlert) {
					alerts.push(cause);
				} else if (severity === SeverityInform) {
					informs.push(cause);
				}
			} else if (blur === BlurMedia) {
				if (context === ContextContentMedia || context === ContextProfileMedia) {
					blurs.push(cause);

					if (flags & FlagsForced) {
						overridable = false;
					}
				} else if (severity === SeverityAlert) {
					alerts.push(cause);
				} else if (severity === SeverityInform) {
					informs.push(cause);
				}
			} else if (blur === BlurNone) {
				if (severity === SeverityAlert) {
					alerts.push(cause);
				} else if (severity === SeverityInform) {
					informs.push(cause);
				}
			}
		}
	}

	return {
		o: overridable,
		f: filters.sort(sortByPriority),
		b: blurs.sort(sortByPriority),
		a: alerts,
		i: informs,
	};
};

const sortByPriority = (a: ModerationCause, b: ModerationCause) => {
	return a.p - b.p;
};

// export const finalizeModeration = (accu: ModerationCause[]): ModerationDecision | null => {
// 	accu.sort((a, b) => a.p - b.p);

// 	if (accu.length > 0) {
// 		const cause = accu.sort((a, b) => a.p - b.p)[0];

// 		// Other moderation cause types should result in a blur only.
// 		const isLabelCause = cause.t === CauseLabel;

// 		const blur = isLabelCause ? cause.d.b : BlurAll;
// 		const sev = isLabelCause ? cause.d.s : SeverityNone;

// 		return {
// 			s: cause,

// 			f: (isLabelCause || cause.t === CauseMutedKeyword) && cause.v === PreferenceHide,
// 			a: sev === SeverityAlert,
// 			i: sev === SeverityInform,
// 			b: blur === BlurAll,
// 			m: blur === BlurMedia,
// 		};
// 	}

// 	return null;
// };

export const isProfileTempMuted = (prefs: ModerationOptions, actor: At.DID): number | null => {
	const date = prefs.tempMutes[actor];
	return date !== undefined && Date.now() < date ? date : null;
};
