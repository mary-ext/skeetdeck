export const enum ViewKind {
	CHANNEL_LISTING,
	SETTINGS,

	CHANNEL,
}

export type View =
	| { kind: ViewKind.CHANNEL_LISTING }
	| { kind: ViewKind.CHANNEL; id: string }
	| { kind: ViewKind.SETTINGS };

export type ViewParams<K extends ViewKind, V = View> = V extends { kind: K } ? Omit<V, 'kind'> : never;
