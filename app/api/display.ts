import type { RefOf } from '~/api/atp-schema.ts';

export const MAX_DISPLAYNAME_LENGTH = 64;
export const MAX_BIO_LENGTH = 256;

type ListPurpose = RefOf<'app.bsky.graph.defs#listPurpose'>;

export const ListPurposeLabels: Record<ListPurpose, string> = {
	'app.bsky.graph.defs#modlist': 'Moderation list',
	'app.bsky.graph.defs#curatelist': 'Curation list',
};

export const LabelNames: Record<string, string> = {
	porn: 'Pornography',
	sexual: 'Sexually suggestive',
	nudity: 'Nudity',
	nsfl: 'NSFL',
	corpse: 'Corpse',
	gore: 'Gore',
	torture: 'Torture',
	'self-harm': 'Self-harm',
	'intolerant-race': 'Racial intolerance',
	'intolerant-gender': 'Gender intolerance',
	'intolerant-sexual-orientation': 'Sexual orientation intolerance',
	'intolerant-religion': 'Religious intolerance',
	intolerant: 'Intolerance',
	'icon-intolerant': 'Intolerant iconography',
	threat: 'Threats',
	spoiler: 'Spoiler',
	spam: 'Spam',
	'account-security': 'Security concerns',
	'net-abuse': 'Network attacks',
	impersonation: 'Impersonation',
	scam: 'Scam',
};

export const renderLabelNames = (name: string) => {
	return LabelNames[name] ?? name;
};
