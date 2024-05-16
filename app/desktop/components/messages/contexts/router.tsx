import type { At } from '~/api/atp-schema';

export const enum ViewKind {
	CHANNEL_LISTING,
	SETTINGS,
	CHANNEL,
	RESOLVE_CHANNEL,
}

export type View =
	| { kind: ViewKind.CHANNEL_LISTING }
	| { kind: ViewKind.CHANNEL; id: string }
	| { kind: ViewKind.RESOLVE_CHANNEL; members: At.DID[] }
	| { kind: ViewKind.SETTINGS };

export type ViewParams<K extends ViewKind, V = View> = V extends { kind: K } ? Omit<V, 'kind'> : never;
