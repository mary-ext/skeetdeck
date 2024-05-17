import { EQUALS_DEQUAL } from '~/utils/dequal';
import { signal, type Signal } from '~/utils/signals';

import type { At, Brand, ChatBskyActorDefs, ChatBskyConvoDefs } from '../atp-schema';

import { mergeProfile, type SignalizedProfile } from './profiles';

type Convo = ChatBskyConvoDefs.ConvoView;
type ConvoProfile = Omit<ChatBskyActorDefs.ProfileViewBasic, typeof Brand.Type>;

export const convos: Record<string, WeakRef<SignalizedConvo>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = convos[id];

	if (!ref || !ref.deref()) {
		delete convos[id];
	}
});

export class SignalizedConvo {
	readonly uid: At.DID;
	_key?: number;

	id: string;
	rev: string;
	self: SignalizedProfile;
	recipients: Signal<SignalizedProfile[]>;
	muted: Signal<boolean>;
	unread: Signal<boolean>;
	lastMessage: Signal<Convo['lastMessage']>;

	constructor(uid: At.DID, convo: Convo, key?: number) {
		this.uid = uid;
		this._key = key;

		this.id = convo.id;
		this.rev = convo.rev;
		this.self = mergeProfile(uid, convo.members.find((m) => m.did === uid) as ConvoProfile, key);
		this.recipients = signal(mapMembers(uid, convo.members, key), EQUALS_DEQUAL);
		this.muted = signal(convo.muted);
		this.unread = signal(convo.unreadCount > 0);
		this.lastMessage = signal(convo.lastMessage);
	}
}

export const createConvoId = (uid: At.DID, convoId: string) => {
	return uid + '|' + convoId;
};

export const getCachedConvo = (uid: At.DID, convoId: string) => {
	const id = createConvoId(uid, convoId);
	const ref = convos[id];

	return ref?.deref();
};

export const mergeConvo = (uid: At.DID, convo: Convo, key?: number) => {
	let id = createConvoId(uid, convo.id);

	let ref: WeakRef<SignalizedConvo> | undefined = convos[id];
	let val: SignalizedConvo;

	if (!ref || !(val = ref.deref()!)) {
		val = new SignalizedConvo(uid, convo);
		convos[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;
		mergeProfile(uid, convo.members.find((m) => m.did === uid) as ConvoProfile, key);

		val.rev = convo.rev;
		val.recipients.value = mapMembers(uid, convo.members, key);
		val.muted.value = convo.muted;
		val.unread.value = convo.unreadCount > 0;
		val.lastMessage.value = convo.lastMessage;
	}

	return val;
};

const mapMembers = (
	uid: At.DID,
	members: ChatBskyActorDefs.ProfileViewBasic[],
	key?: number,
): SignalizedProfile[] => {
	return members.filter((m) => m.did !== uid).map((m) => mergeProfile(uid, m as ConvoProfile, key));
};
