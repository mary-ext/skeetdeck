import { BskyXRPC } from '@mary/bluesky-client';

import type { At } from '../atp-schema';

import { type MultiagentAccountData, Multiagent } from '../classes/multiagent';

export const multiagent = new Multiagent('accs');

export const publicAppView = new BskyXRPC({ service: 'https://api.bsky.app' });

export const getAccountData = (uid: At.DID | undefined): MultiagentAccountData | undefined => {
	return uid !== undefined ? multiagent.accounts.find((acc) => acc.did === uid) : undefined;
};

export const renderAccountHandle = (account: MultiagentAccountData) => {
	// const handle = account.profile?.handle;
	// return handle && handle !== 'handle.invalid' ? handle : account.session.handle;

	return account.session.handle;
};

export const renderAccountName = (account: MultiagentAccountData) => {
	return account.profile?.displayName || `@` + account.session.handle;
};

export const getAccountHandle = (uid: At.DID): string | null => {
	const account = getAccountData(uid);

	if (account) {
		return renderAccountHandle(account);
	}

	return null;
};
