import type { At, ComAtprotoLabelDefs } from '../atp-schema';

import type { KeywordPreference } from './enums';

export type Label = ComAtprotoLabelDefs.Label;

export interface LabelDefinition {
	/** The group ID that the label falls under */
	// g: string;
	/** Enforce a specific preference value, means that the user can't configure what to do with this label */
	e?: number;
	/** Additional flags for this label */
	f: number;
	/** Actions to take for this label */
	a: number;
}

export type LabelDefinitionMap = Record<string, LabelDefinition>;

export interface ModerationLabelOpts {
	// groups: { [group: string]: number | undefined };
	labels: { [label: string]: number | undefined };
}

export type ModerationFilterKeywordOpts = [keyword: string, whole: boolean];

export interface ModerationFiltersOpts {
	// Only these properties are ever used during actual filtering
	name: string;
	pref: KeywordPreference;
	match: string;
	noFollows: boolean;

	// These are used in the preferences UI
	id: string;
	matchers: ModerationFilterKeywordOpts[];
}

export interface ModerationOpts {
	_filtersCache?: [raw: string, match: RegExp][];

	globals: ModerationLabelOpts;
	// users: { [user: At.DID]: ModerationLabelOpts | undefined };
	labelers: { [labeler: At.DID]: ModerationLabelOpts | undefined };
	keywords: ModerationFiltersOpts[];
}
