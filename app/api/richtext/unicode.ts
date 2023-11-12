/**
 * Javascript uses utf16-encoded strings while most environments and specs
 * have standardized around utf8 (including JSON).
 *
 * After some lengthy debated we decided that richtext facets need to use
 * utf8 indices. This means we need tools to convert indices between utf8
 * and utf16, and that's precisely what this library handles.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface UtfString {
	u16: string;
	u8: Uint8Array;
}

export const createUtfString = (utf16: string): UtfString => {
	return {
		u16: utf16,
		u8: encoder.encode(utf16),
	};
};

export const getUtf8Length = (utf: UtfString) => {
	return utf.u8.byteLength;
};

export const sliceUtf8 = (utf: UtfString, start?: number, end?: number) => {
	return decoder.decode(utf.u8.slice(start, end));
};
