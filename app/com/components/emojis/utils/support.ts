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

let promise: Promise<number>;
export const detectEmojiSupportLevel = (): Promise<number> => {
	return (promise ||= new Promise((resolve) => {
		scheduleIdleTask(() => {
			for (const [emoji, version] of emojiVersions) {
				if (isEmojiSupportedUncached(emoji)) {
					return resolve(version);
				}
			}

			// In case of an error, be generous and just assume all emoji are supported (e.g. for canvas errors
			// due to anti-fingerprinting add-ons). Better to show some gray boxes than nothing at all.
			resolve(emojiVersions[0][1]);
		});
	}));
};

const supportedEmojis = new Map<string, boolean>();

export const isEmojiSupported = (emoji: string) => {
	let cached = supportedEmojis.get(emoji);

	if (cached === undefined) {
		supportedEmojis.set(emoji, (cached = isEmojiSupportedUncached(emoji)));
		console.log(`is ${emoji} supported?`, cached);
	}

	return cached;
};

export const hasZwj = (emoji: string) => {
	return emoji.includes('\u200d');
};

// Taken from https://gitlab.com/gitlab-org/gitlab-foss/-/blob/3c9a2dd62025043448c9ea9a6df86422874ee4be/app/assets/javascripts/emoji/support/unicode_support_map.js
// Licensed under MIT license
let ctx: CanvasRenderingContext2D | null | undefined;

// We use 16px because mobile Safari (iOS 9.3) doesn't properly scale emojis :/
// See 32px, https://i.imgur.com/htY6Zym.png
// See 16px, https://i.imgur.com/FPPsIF8.png
const FONT_SIZE = 16;

const CANVAS_WIDTH = 2 * FONT_SIZE;
const CANVAS_HEIGHT = FONT_SIZE;

const isPixelValid = (data: Uint8ClampedArray, pixelOffset: number) => {
	// `4 *` because RGBA
	const indexOffset = 4 * pixelOffset;

	const hasColor = data[indexOffset + 0] || data[indexOffset + 1] || data[indexOffset + 2];
	const isVisible = data[indexOffset + 3];

	if (hasColor && isVisible) {
		return true;
	}

	return false;
};

export const isEmojiSupportedUncached = (emoji: string) => {
	if (ctx === undefined) {
		try {
			ctx = document.createElement('canvas').getContext('2d')!;

			ctx.canvas.width = CANVAS_WIDTH;
			ctx.canvas.height = CANVAS_HEIGHT;

			ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
			ctx.textBaseline = 'middle';

			ctx.fillStyle = '#000000';
		} catch {}
	}

	// If canvas is blocked, we'll take tofu boxes over filtering everything out
	if (ctx == null) {
		return true;
	}

	ctx.clearRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);
	ctx.fillText(emoji, 0, FONT_SIZE / 2);

	const data = ctx.getImageData(0, FONT_SIZE / 2, 2 * FONT_SIZE, 1).data;

	let validEmoji = false;

	// Sample along the vertical-middle for a couple of characters
	for (let pixel = 0; pixel < 64; pixel += 1) {
		const isLookingAtFirstChar = pixel < FONT_SIZE;
		const isLookingAtSecondChar = pixel >= FONT_SIZE + FONT_SIZE / 2;

		// Check for the emoji somewhere along the row
		if (isLookingAtFirstChar && isPixelValid(data, pixel)) {
			validEmoji = true;

			// Check to see that nothing is rendered next to the first character
			// to ensure that the ZWJ sequence rendered as one piece
		} else if (isLookingAtSecondChar && isPixelValid(data, pixel)) {
			return false;
		}
	}

	return validEmoji;
};
