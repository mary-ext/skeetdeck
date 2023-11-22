// https://github.com/nolanlawson/emoji-picker-element/blob/497681f21119c5cc675fd59a1684b1a0d392215e/src/picker/utils/emojiSupport.js#L6

import { scheduleIdleTask } from '~/utils/idle.ts';

// It's important to list Twemoji Mozilla before everything else, because Mozilla bundles their
// own font on some platforms (notably Windows and Linux as of this writing). Typically, Mozilla
// updates faster than the underlying OS, and we don't want to render older emoji in one font and
// newer emoji in another font:
// https://github.com/nolanlawson/emoji-picker-element/pull/268#issuecomment-1073347283
const FONT_FAMILY =
	'"Twemoji Mozilla","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol",' +
	'"Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';

const CANVAS_HEIGHT = 25;
const CANVAS_WIDTH = 20;

const FONT_SIZE = Math.floor(CANVAS_HEIGHT / 2);

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

// Taken from https://github.com/koala-interactive/is-emoji-supported
// Licensed under MIT license

// Unfortunately, this code doesn't handle compound emojis, which is necessary
// for checking if the system actually supports Unicode 12.1 and 13.1, so let's
// pretend that if Unicode 12 is supported, 12.1 is supported as well.

let ctx: CanvasRenderingContext2D | null | undefined;

export const isEmojiSupportedUncached = (emoji: string): boolean => {
	if (ctx === undefined) {
		try {
			ctx = document.createElement('canvas').getContext('2d')!;
		} catch {}

		// Set the canvas up for reuse
		if (ctx) {
			ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
			ctx.textBaseline = 'top';
			ctx.canvas.width = CANVAS_WIDTH * 2;
			ctx.canvas.height = CANVAS_HEIGHT;
		}
	}

	// If canvas is blocked, we'll take tofu boxes over filtering everything out
	if (ctx == null) {
		return true;
	}

	ctx.clearRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);

	// Draw in red on the left
	ctx.fillStyle = '#FF0000';
	ctx.fillText(emoji, 0, 22);

	// Draw in blue on right
	ctx.fillStyle = '#0000FF';
	ctx.fillText(emoji, CANVAS_WIDTH, 22);

	const a = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
	const count = a.length;
	let i = 0;

	// Search the first visible pixel
	for (; i < count && !a[i + 3]; i += 4);

	// No visible pixel
	if (i >= count) {
		return false;
	}

	// Emoji has immutable color, so we check the color of the emoji in two different colors
	// the result show be the same.
	const x = CANVAS_WIDTH + ((i / 4) % CANVAS_WIDTH);
	const y = Math.floor(i / 4 / CANVAS_WIDTH);
	const b = ctx.getImageData(x, y, 1, 1).data;

	if (a[i] !== b[0] || a[i + 2] !== b[2]) {
		return false;
	}

	// Some emojis are a contraction of different ones, so if it's not
	// supported, it will show multiple characters
	if (ctx.measureText(emoji).width >= CANVAS_WIDTH) {
		return false;
	}

	// Supported
	return true;
};

const supportedEmojis = new Map<string, boolean>();

export const isEmojiSupported = (emoji: string): boolean => {
	let cached = supportedEmojis.get(emoji);

	if (cached === undefined) {
		supportedEmojis.set(emoji, (cached = isEmojiSupportedUncached(emoji)));
	}

	return cached;
};

export const hasZwj = (emoji: string): boolean => {
	return emoji.includes('\u200d');
};

let promise: Promise<number>;
export const detectEmojiSupportLevel = (): Promise<number> => {
	return (promise ||= new Promise((resolve) => {
		scheduleIdleTask(() => {
			try {
				for (const [emoji, version] of emojiVersions) {
					// We don't need to cache these emojis because we'll be filtering
					// them out in the UI
					if (isEmojiSupportedUncached(emoji)) {
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
