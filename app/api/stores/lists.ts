import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, RefOf } from '../atp-schema.ts';
import { markRaw } from '../utils/misc.ts';
import { type SignalizedProfile, mergeProfile } from './profiles.ts';

type List = RefOf<'app.bsky.graph.defs#listView'>;

export const lists: Record<string, WeakRef<SignalizedList>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = lists[id];

	if (!ref || !ref.deref()) {
		delete lists[id];
	}
});

/** @see BskyList */
export interface SignalizedList {
	_key?: number;
	uri: List['uri'];
	cid: Signal<List['cid']>;
	creator: SignalizedProfile;
	name: Signal<List['name']>;
	purpose: Signal<List['purpose']>;
	description: Signal<List['description']>;
	descriptionFacets: Signal<List['descriptionFacets']>;
	avatar: Signal<List['avatar']>;
	viewer: {
		muted: Signal<NonNullable<List['viewer']>['muted']>;
		blocked: Signal<NonNullable<List['viewer']>['blocked']>;
	};

	$richtext?: unknown;
}

const createSignalizedList = (uid: DID, list: List, key?: number): SignalizedList => {
	return markRaw({
		_key: key,
		uri: list.uri,
		cid: signal(list.cid),
		creator: mergeProfile(uid, list.creator, key),
		name: signal(list.name),
		purpose: signal(list.purpose),
		description: signal(list.description),
		descriptionFacets: signal(list.descriptionFacets),
		avatar: signal(list.avatar),
		viewer: {
			muted: signal(list.viewer?.muted),
			blocked: signal(list.viewer?.blocked),
		},
	});
};

export const createListId = (uid: DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedList = (uid: DID, uri: string) => {
	const id = createListId(uid, uri);
	const ref = lists[id];

	return ref && ref.deref();
};

export const mergeList = (uid: DID, list: List, key?: number) => {
	let id = createListId(uid, list.uri);

	let ref: WeakRef<SignalizedList> | undefined = lists[id];
	let val: SignalizedList;

	if (!ref || !(val = ref.deref()!)) {
		gc.register((val = createSignalizedList(uid, list, key)), id);
		lists[id] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = list.cid;

		val.creator = mergeProfile(uid, list.creator, key);

		val.name.value = list.name;
		val.purpose.value = list.purpose;
		val.description.value = list.description;
		val.descriptionFacets.value = list.descriptionFacets;
		val.avatar.value = list.avatar;

		val.viewer.muted.value = list.viewer?.muted;
		val.viewer.blocked.value = list.viewer?.blocked;
	}

	return val;
};
