import type { At } from '@atcute/client/lexicons';

export const enum ViewKind {
	CHANNEL_LISTING,
	CHANNEL,
	NEW_CHANNEL,
	RESOLVE_CHANNEL,
	SETTINGS,
}

export type View =
	| { kind: ViewKind.CHANNEL_LISTING }
	| { kind: ViewKind.CHANNEL; id: string }
	| { kind: ViewKind.NEW_CHANNEL }
	| { kind: ViewKind.RESOLVE_CHANNEL; members: At.DID[] }
	| { kind: ViewKind.SETTINGS };

export type ViewParams<K extends ViewKind, V = View> = V extends { kind: K } ? Omit<V, 'kind'> : never;
