import type { At } from '../atp-schema';

import type { Label, LabelDefinition, ModerationOpts } from './types';
import {
	type KeywordPreference,
	type LabelPreference,
	ActionAlert,
	ActionBlur,
	ActionBlurMedia,
	FlagNoOverride,
	PreferenceHide,
	PreferenceWarn,
} from './enums';

import { LABELS } from './labels';

// Moderation cause types
export const CauseLabel = 1;
export const CauseMutedPermanent = 2;
export const CauseMutedTemporary = 3;
export const CauseMutedKeyword = 4;

interface BaseModerationCause {
	/** Cause type */
	t: number;
	/** Cause priority */
	p: number;
}

export interface LabelModerationCause extends BaseModerationCause {
	t: 1;
	p: 1 | 2 | 5 | 7 | 8;

	/** Labeler DID */
	s: string;
	/** Label data */
	l: Label;
	/** Label definition */
	d: LabelDefinition;
	/** User's set preference for this cause */
	v: LabelPreference;
}

export interface MutedPermanentModerationCause extends BaseModerationCause {
	t: 2;
	p: 6;
}

export interface MutedTemporaryModerationCause extends BaseModerationCause {
	t: 3;
	p: 6;

	/** Temporary mute duration */
	d: number;
}

export interface MutedKeywordModerationCause extends BaseModerationCause {
	t: 4;
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

export interface ModerationDecision {
	/** Moderation cause responsible for this decision */
	s: ModerationCause;

	/** Whether content should be filtered out */
	f: boolean;
	/** Whether content should be shown an alert */
	a: boolean;
	/** Whether content should be blurred (shown a warning), this applies to the whole content */
	b: boolean;
	/** Whether content should be blurred (shown a warning), this applies only to images/videos */
	m: boolean;
}

/**
 * @param accu Array of moderation causes to push into
 * @param labels Labels to work upon
 * @param userDid DID of the author
 * @param opts Moderation options
 */
export const decideLabelModeration = (
	accu: ModerationCause[],
	labels: Label[] | undefined,
	userDid: At.DID,
	opts: ModerationOpts,
) => {
	if (labels) {
		const globalPref = opts.globals;

		for (let idx = 0, len = labels.length; idx < len; idx++) {
			const label = labels[idx];

			const id = label.val;

			const def = LABELS[id];
			if (!def) {
				// We don't know anything about this label, let's move on
				continue;
			}

			const src = label.src;
			const isSelfLabeled = src === userDid;

			let pref: number | undefined = def.e;

			if (pref === undefined) {
				if (isSelfLabeled) {
					pref = globalPref.labels[id];
				} else {
					const labelerPref = opts.labelers[src];

					if (!labelerPref) {
						continue;
					}

					pref = labelerPref.labels[id] ?? globalPref.labels[id];
				}
			}

			if (pref !== PreferenceHide && pref !== PreferenceWarn) {
				continue;
			}

			let priority: LabelModerationCause['p'];
			if (def.f & FlagNoOverride) {
				priority = 1;
			} else if (pref === PreferenceHide) {
				priority = 2;
			} else if (def.a === ActionBlur) {
				priority = 5;
			} else if (def.a === ActionBlurMedia) {
				priority = 7;
			} else {
				priority = 8;
			}

			accu.push({
				t: CauseLabel,
				p: priority,

				s: src,
				l: label,
				d: def,
				v: pref,
			});
		}
	}

	return accu;
};

export const decideMutedPermanentModeration = (accu: ModerationCause[], muted: boolean | undefined) => {
	if (muted) {
		accu.push({ t: CauseMutedPermanent, p: 6 });
	}

	return accu;
};

export const decideMutedTemporaryModeration = (accu: ModerationCause[], duration: number | null) => {
	if (duration != null) {
		accu.push({ t: CauseMutedTemporary, p: 6, d: duration });
	}

	return accu;
};

const shouldAllowKeywordFilter = (filterPref: KeywordPreference, pref: KeywordPreference) => {
	switch (pref) {
		case PreferenceWarn:
			return filterPref === pref || filterPref === PreferenceHide;
		case PreferenceHide:
			return filterPref === pref;
	}

	return false;
};

export const decideMutedKeywordModeration = (
	accu: ModerationCause[],
	text: string,
	following: boolean,
	pref: KeywordPreference,
	opts: ModerationOpts,
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

export const finalizeModeration = (accu: ModerationCause[]): ModerationDecision | null => {
	if (accu.length > 0) {
		const cause = accu.sort((a, b) => a.p - b.p)[0];

		// Other moderation cause types should result in a blur only.
		const isLabelCause = cause.t === CauseLabel;
		const action = isLabelCause ? cause.d.a : ActionBlur;

		return {
			s: cause,

			f: (isLabelCause || cause.t === CauseMutedKeyword) && cause.v === PreferenceHide,
			a: action === ActionAlert,
			b: action === ActionBlur,
			m: action === ActionBlurMedia,
		};
	}

	return null;
};
