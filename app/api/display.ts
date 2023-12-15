import type { RefOf } from '~/api/atp-schema.ts';

export const MAX_DISPLAYNAME_LENGTH = 64;
export const MAX_BIO_LENGTH = 256;

type ListPurpose = RefOf<'app.bsky.graph.defs#listPurpose'>;

export const ListPurposeLabels: Record<ListPurpose, string> = {
	'app.bsky.graph.defs#modlist': 'Moderation list',
	'app.bsky.graph.defs#curatelist': 'Curation list',
};

export const renderListPurposeLabel = (purpose: string) => {
	return ListPurposeLabels[purpose] || 'Unknown list';
};

export const LabelNames: Record<string, string> = {
	// system
	'!hide': 'Hidden by moderators',
	'!no-promote': 'Filtered by moderators',
	'!warn': 'Generic warning',

	// legal
	'dmca-violation': 'Copyright violation',
	doxxing: 'Doxxing',

	// sexual
	porn: 'Pornography',
	sexual: 'Sexually suggestive',
	nudity: 'Nudity',

	// violence
	nsfl: 'NSFL',
	corpse: 'Corpse',
	gore: 'Gore',
	torture: 'Torture',
	'self-harm': 'Self-harm',

	// intolerance
	'intolerant-race': 'Racial intolerance',
	'intolerant-gender': 'Gender intolerance',
	'intolerant-sexual-orientation': 'Sexual orientation intolerance',
	'intolerant-religion': 'Religious intolerance',
	intolerant: 'Intolerance',
	'icon-intolerant': 'Intolerant iconography',

	// rude
	threat: 'Threats',

	// curation
	spoiler: 'Spoiler',

	// spam
	spam: 'Spam',

	// misinfo
	'account-security': 'Security concerns',
	'net-abuse': 'Network attacks',
	impersonation: 'Impersonation',
	scam: 'Scam',
};

export const renderLabelName = (name: string) => {
	return LabelNames[name] ?? name;
};

export const LabelGroupNames: Record<string, string> = {
	sexual: 'Adult content',
	violence: 'Violence',
	intolerance: 'Intolerance',
	rude: 'Rude',
	curation: 'Curational',
	spam: 'Spam',
	misinfo: 'Misinformation',
};

export const renderLabelGroupName = (name: string) => {
	return LabelGroupNames[name] ?? name;
};
