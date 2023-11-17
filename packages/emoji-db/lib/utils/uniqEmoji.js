import { uniqBy } from './uniqBy.js';

export const uniqEmoji = (emojis) => {
	return uniqBy(emojis, (_) => _.unicode);
};
