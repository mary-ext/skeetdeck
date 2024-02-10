import type { DID } from '../atp-schema';
import { multiagent } from '../globals/agent';

export const updateNotificationsSeen = async (uid: DID, date = new Date()) => {
	const agent = await multiagent.connect(uid);

	await agent.rpc.call('app.bsky.notification.updateSeen', {
		data: { seenAt: date.toISOString() },
	});
};
