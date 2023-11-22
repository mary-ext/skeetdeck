// https://github.com/nolanlawson/emoji-picker-element/blob/497681f21119c5cc675fd59a1684b1a0d392215e/src/picker/utils/emojiSupport.js#L6

import { scheduleIdleTask } from '~/utils/idle.ts';

// It's important to list Twemoji Mozilla before everything else, because Mozilla bundles their
// own font on some platforms (notably Windows and Linux as of this writing). Typically, Mozilla
// updates faster than the underlying OS, and we don't want to render older emoji in one font and
// newer emoji in another font:
// https://github.com/nolanlawson/emoji-picker-element/pull/268#issuecomment-1073347283
const FONT_FAMILY = '"Twemoji Mozilla", "Noto Color Emoji", sans-serif';

// Find one good representative emoji from each version to test by checking its color.
// Ideally it should have color in the center. For some inspiration, see:
// https://about.gitlab.com/blog/2018/05/30/journey-in-native-unicode-emoji/
//
// Note that for certain versions (12.1, 13.1), there is no point in testing them explicitly, because
// all the emoji from this version are compound-emoji from previous versions. So they would pass a color
// test, even in browsers that display them as double emoji. (E.g. "face in clouds" might render as
// "face without mouth" plus "fog".) These emoji can only be filtered using the width test,
// which happens in checkZwjSupport
const emojiVersions: [emoji: string, version: number][] = [
	['🫨', 15],
	['🫠', 14],
	['🥲', 13.1], // smiling face with tear, technically from v13 but see note above
	['🥻', 12.1], // sari, technically from v12 but see note above
	['🥰', 11],
	['🤩', 5],
	['👱‍♀️', 4],
	['🤣', 3],
	['👁️‍🗨️', 2],
	['😀', 1],
	['😐️', 0.7],
	['😃', 0.6],
];

// Unfortunately, this code doesn't handle compound emojis, which is necessary
// for checking if the system actually supports Unicode 12.1 and 13.1, so let's
// pretend that if Unicode 12 is supported, 12.1 is supported as well.
const getTextFeature = (text: string, color: string) => {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;

	const ctx = canvas.getContext('2d')!;
	ctx.textBaseline = 'top';
	ctx.font = `100px ${FONT_FAMILY}`;
	ctx.fillStyle = color;
	ctx.scale(0.01, 0.01);
	ctx.fillText(text, 0, 0);

	return ctx.getImageData(0, 0, 1, 1).data;
};

const compareFeatures = (feature1: Uint8ClampedArray, feature2: Uint8ClampedArray) => {
	const feature1Str = [...feature1].join(',');
	const feature2Str = [...feature2].join(',');

	// This is RGBA, so for 0,0,0, we are checking that the first RGB is not all zeroes.
	// Most of the time when unsupported this is 0,0,0,0, but on Chrome on Mac it is
	// 0,0,0,61 - there is a transparency here.
	return feature1Str === feature2Str && !feature1Str.startsWith('0,0,0,');
};

const isEmojiSupported = (text: string) => {
	const feature1 = getTextFeature(text, '#000');
	const feature2 = getTextFeature(text, '#fff');
	return feature1 && feature2 && compareFeatures(feature1, feature2);
};

let promise: Promise<number>;
export const detectEmojiSupportLevel = (): Promise<number> => {
	return (promise ||= new Promise((resolve) => {
		scheduleIdleTask(() => {
			try {
				for (const [emoji, version] of emojiVersions) {
					if (isEmojiSupported(emoji)) {
						return resolve(version);
					}
				}
			} catch {
				// ignore canvas errors
			}

			// In case of an error, be generous and just assume all emoji are supported (e.g. for canvas errors
			// due to anti-fingerprinting add-ons). Better to show some gray boxes than nothing at all.
			resolve(emojiVersions[0][1]);
		});
	}));
};
