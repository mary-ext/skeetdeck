import { type Signal, signal } from '~/utils/signals';

import type { DID, RefOf } from '../atp-schema';
import { type SignalizedProfile, mergeProfile } from './profiles';

type List = RefOf<'app.bsky.graph.defs#listView'>;

export const lists: Record<string, WeakRef<SignalizedList>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = lists[id];

	if (!ref || !ref.deref()) {
		delete lists[id];
	}
});

export class SignalizedList {
	readonly uid: DID;
	_key?: number;

	readonly uri: List['uri'];
	readonly cid: Signal<List['cid']>;
	readonly creator: SignalizedProfile;
	readonly name: Signal<List['name']>;
	readonly purpose: Signal<List['purpose']>;
	readonly description: Signal<List['description']>;
	readonly descriptionFacets: Signal<List['descriptionFacets']>;
	readonly avatar: Signal<List['avatar']>;

	readonly viewer: {
		readonly muted: Signal<NonNullable<List['viewer']>['muted']>;
		readonly blocked: Signal<NonNullable<List['viewer']>['blocked']>;
	};

	constructor(uid: DID, list: List, key?: number) {
		this.uid = uid;
		this._key = key;

		this.uri = list.uri;
		this.cid = signal(list.cid);
		this.creator = mergeProfile(uid, list.creator, key);
		this.name = signal(list.name);
		this.purpose = signal(list.purpose);
		this.description = signal(list.description);
		this.descriptionFacets = signal(list.descriptionFacets);
		this.avatar = signal(list.avatar);

		this.viewer = {
			muted: signal(list.viewer?.muted),
			blocked: signal(list.viewer?.blocked),
		};
	}
}

export const createListId = (uid: DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedList = (uid: DID, uri: string) => {
	const id = createListId(uid, uri);
	const ref = lists[id];

	return ref && ref.deref();
};

export const removeCachedList = (uid: DID, uri: string) => {
	const id = createListId(uid, uri);

	const ref = lists[id];
	const val = ref?.deref();

	if (val) {
		gc.unregister(val);
		delete lists[id];
	}
};

export const mergeList = (uid: DID, list: List, key?: number) => {
	let id = createListId(uid, list.uri);

	let ref: WeakRef<SignalizedList> | undefined = lists[id];
	let val: SignalizedList;

	if (!ref || !(val = ref.deref()!)) {
		val = new SignalizedList(uid, list, key);
		lists[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = list.cid;

		mergeProfile(uid, list.creator, key);

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
