import {
	ActionAlert,
	ActionBlur,
	ActionBlurMedia,
	FlagNoOverride,
	PreferenceHide,
	PreferenceWarn,
} from './enums.ts';
import type { LabelDefinitionMap } from './types.ts';

// const LabelSystem = 'system';
// const LabelLegal = 'legal';
// const LabelSexual = 'sexual';
// const LabelViolence = 'violence';
// const LabelIntolerance = 'intolerance';
// const LabelRude = 'rude';
// const LabelCuration = 'curation';
// const LabelSpam = 'spam';
// const LabelMisinfo = 'misinfo';

export const LABELS: LabelDefinitionMap = {
	'!hide': {
		// g: LabelSystem,
		e: PreferenceHide,
		f: FlagNoOverride,
		a: ActionBlur,
	},
	'!no-promote': {
		// g: LabelSystem,
		e: PreferenceHide,
		f: 0,
		a: 0,
	},
	'!warn': {
		// g: LabelSystem,
		e: PreferenceWarn,
		f: 0,
		a: ActionBlur,
	},

	'dmca-violation': {
		// g: LabelLegal,
		e: PreferenceHide,
		f: FlagNoOverride,
		a: ActionBlur,
	},
	doxxing: {
		// g: LabelLegal,
		e: PreferenceHide,
		f: FlagNoOverride,
		a: ActionBlur,
	},

	porn: {
		// g: LabelSexual,
		f: 0,
		a: ActionBlurMedia,
	},
	sexual: {
		// g: LabelSexual,
		f: 0,
		a: ActionBlurMedia,
	},
	nudity: {
		// g: LabelSexual,
		f: 0,
		a: ActionBlurMedia,
	},

	nsfl: {
		// g: LabelViolence,
		f: 0,
		a: ActionBlurMedia,
	},
	corpse: {
		// g: LabelViolence,
		f: 0,
		a: ActionBlurMedia,
	},
	gore: {
		// g: LabelViolence,
		f: 0,
		a: ActionBlurMedia,
	},
	torture: {
		// g: LabelViolence,
		f: 0,
		a: ActionBlur,
	},
	'self-harm': {
		// g: LabelViolence,
		f: 0,
		a: ActionBlurMedia,
	},

	intolerant: {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlur,
	},
	'intolerant-race': {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlur,
	},
	'intolerant-gender': {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlur,
	},
	'intolerant-sexual-orientation': {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlur,
	},
	'intolerant-religion': {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlur,
	},
	'icon-intolerant': {
		// g: LabelIntolerance,
		f: 0,
		a: ActionBlurMedia,
	},

	threat: {
		// g: LabelRude,
		f: 0,
		a: ActionBlur,
	},

	spoiler: {
		// g: LabelCuration,
		f: 0,
		a: ActionBlur,
	},

	spam: {
		// g: LabelSpam,
		f: 0,
		a: ActionBlur,
	},

	'account-security': {
		// g: LabelMisinfo,
		f: 0,
		a: ActionBlur,
	},
	'net-abuse': {
		// g: LabelMisinfo,
		f: 0,
		a: ActionBlur,
	},
	impersonation: {
		// g: LabelMisinfo,
		f: 0,
		a: ActionAlert,
	},
	scam: {
		// g: LabelMisinfo,
		f: 0,
		a: ActionAlert,
	},
};
