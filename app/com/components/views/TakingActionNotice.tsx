import type { JSX } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import { getAccountHandle, multiagent } from '~/api/globals/agent.ts';

export interface TakingActionNoticeProps {
	uid: DID;
}

const TakingActionNotice = (props: TakingActionNoticeProps) => {
	return (() => {
		if (multiagent.accounts.length > 1) {
			const handle = getAccountHandle(props.uid);

			return (
				<p class="text-sm text-muted-fg">
					Taking action as <span class="font-bold">{`@${handle}`}</span>
				</p>
			);
		}
	}) as unknown as JSX.Element;
};

export default TakingActionNotice;
