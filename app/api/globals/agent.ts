import type { DID } from '~/api/atp-schema.ts';

import { type MultiagentAccountData, Multiagent } from '~/api/classes/multiagent.ts';

export const multiagent = new Multiagent('accs');

export const getAccountData = (uid: DID): MultiagentAccountData | undefined => {
	return multiagent.accounts.find((acc) => acc.did === uid);
};

export const renderAccountHandle = (account: MultiagentAccountData) => {
	const handle = account.profile?.handle;
	return handle && handle !== 'handle.invalid' ? handle : account.session.handle;
};

export const getAccountHandle = (uid: DID): string | null => {
	const account = getAccountData(uid);

	if (account) {
		return renderAccountHandle(account);
	}

	return null;
};
