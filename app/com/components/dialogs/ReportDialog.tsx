import type { AtUri, DID, RefOf } from '~/api/atp-schema.ts';

export const REPORT_PROFILE = 1; // 1 << 0
export const REPORT_POST = 2; // 1 << 1
export const REPORT_LIST = 4; // 1 << 2
export const REPORT_FEED = 8; // 1 << 3

export type ReportMessage =
	| { type: typeof REPORT_PROFILE; did: DID }
	| { type: typeof REPORT_POST; uri: AtUri; cid: string }
	| { type: typeof REPORT_LIST; uri: AtUri; cid: string }
	| { type: typeof REPORT_FEED; uri: AtUri; cid: string };

interface ReportOption {
	label: number;
	value: RefOf<'com.atproto.moderation.defs#reasonType'>;
	name: string;
	desc: string;
}

const options: ReportOption[] = [
	{
		label: REPORT_PROFILE,
		value: 'com.atproto.moderation.defs#reasonMisleading',
		name: 'Misleading profile',
		desc: 'False claims about identity or affiliation',
	},

	{
		label: REPORT_POST | REPORT_LIST | REPORT_FEED,
		value: 'com.atproto.moderation.defs#reasonRude',
		name: 'Anti-social behavior',
		desc: 'Harassment, trolling or intolerance',
	},

	{
		label: REPORT_PROFILE | REPORT_LIST,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Community standards violation',
		desc: 'Contains terms that violate community standards',
	},

	{
		label: REPORT_POST,
		value: 'com.atproto.moderation.defs#reasonSexual',
		name: 'Unwanted sexual content',
		desc: 'Nudity or pornography not labeled as such',
	},

	{
		label: REPORT_POST | REPORT_FEED,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Illegal and urgent',
		desc: 'Glaring violations of law or terms of service',
	},

	{
		label: REPORT_POST | REPORT_PROFILE,
		value: 'com.atproto.moderation.defs#reasonSpam',
		name: 'Spam',
		desc: 'Excessive mentions or replies',
	},

	{
		label: REPORT_POST | REPORT_LIST | REPORT_FEED,
		value: 'com.atproto.moderation.defs#reasonOther',
		name: 'Other issues',
		desc: 'Issues not covered by the options above',
	},
];

export interface ReportDialogProps {
	uid: DID;
	report: ReportMessage;
}

const enum ReportStep {
	CHOOSE,
	EXPLAIN,
	FINISHED,
}
