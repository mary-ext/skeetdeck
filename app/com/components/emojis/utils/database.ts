import Database, { type Emoji, type EmojiSkin, type SkinTone } from '@mary/emoji-db';

import { mapDefined } from '~/utils/misc';

import { hasZwj, isEmojiSupported } from './support';

let db: Database;
export const getEmojiDb = () => {
	return (db ||= new Database());
};

const toSkinMap = (skins: EmojiSkin[], emojiSupportLevel: number) => {
	const map: Record<string, string> = {};

	for (const skin of skins) {
		// ignore arrays like [1, 2] with multiple skin tones
		// also ignore variants that are in an unsupported emoji version
		// (these do exist - variants from a different version than their base emoji)
		if (typeof skin.tone === 'number' && skin.version <= emojiSupportLevel) {
			map[skin.tone] = skin.unicode;
		}
	}

	return map as Record<SkinTone, string | undefined>;
};

export interface SummarizedEmoji {
	unicode: string;
	name: string;
	shortcodes: string[] | undefined;
	annotation: string;
	skins: Record<SkinTone, string | undefined> | undefined;
}

export interface PickedEmoji extends SummarizedEmoji {
	picked: string;
}

export const summarizeEmoji = (emoji: Emoji, emojiSupportLevel: number): SummarizedEmoji | undefined => {
	if (emoji.version <= emojiSupportLevel && (!hasZwj(emoji.unicode) || isEmojiSupported(emoji.unicode))) {
		return {
			unicode: emoji.unicode,
			name: emoji.name,
			shortcodes: emoji.shortcodes,
			annotation: emoji.annotation,
			skins: emoji.skins && toSkinMap(emoji.skins, emojiSupportLevel),
		};
	}
};

export const summarizeEmojis = (emojis: Emoji[], emojiSupportLevel: number): SummarizedEmoji[] => {
	return mapDefined(emojis, (emoji) => summarizeEmoji(emoji, emojiSupportLevel));
};
