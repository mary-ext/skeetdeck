import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';

export const updateNotificationsSeen = async (uid: At.DID, date = new Date()) => {
	const agent = await multiagent.connect(uid);

	await agent.rpc.call('app.bsky.notification.updateSeen', {
		data: { seenAt: date.toISOString() },
	});
};
