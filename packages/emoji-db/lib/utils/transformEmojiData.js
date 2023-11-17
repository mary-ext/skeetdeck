import { extractTokens } from './extractTokens.js';
import { normalizeTokens } from './normalizeTokens.js';

// Transform emoji data for storage in IDB
export const transformEmojiData = (emojiData) => {
	const mapped = [];

	for (let i = 0, ilen = emojiData.length; i < ilen; i++) {
		const { annotation, emoticon, group, order, shortcodes, skins, tags, emoji, version } = emojiData[i];

		const tokens = [
			...new Set(
				normalizeTokens([
					...(shortcodes || []).map(extractTokens).flat(),
					...tags.map(extractTokens).flat(),
					...extractTokens(annotation),
					emoticon,
				]),
			),
		].sort();

		const res = {
			annotation,
			group,
			order,
			tags,
			tokens,
			unicode: emoji,
			version,
		};

		if (emoticon) {
			res.emoticon = emoticon;
		}

		if (shortcodes) {
			res.shortcodes = shortcodes;
		}

		if (skins) {
			res.skinTones = [];
			res.skinUnicodes = [];
			res.skinVersions = [];

			for (let j = 0, jlen = skins.length; j < jlen; j++) {
				const { tone, emoji, version } = skins[j];

				res.skinTones.push(tone);
				res.skinUnicodes.push(emoji);
				res.skinVersions.push(version);
			}
		}

		mapped.push(res);
	}

	return mapped;
};
