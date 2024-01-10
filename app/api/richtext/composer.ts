import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';

import type { DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import { asciiLen, graphemeLen } from './intl.ts';
import { isLinkValid, safeUrlParse, toShortUrl } from './renderer.ts';

import type { Facet } from './types.ts';

interface TextSegment {
	type: 'text';
	raw: string;
	text: string;
}

interface EscapeSegment {
	type: 'escape';
	raw: string;
	text: string;
}

interface LinkSegment {
	type: 'link';
	raw: string;
	text: string;
	uri: string;
}

interface MdLinkSegment {
	type: 'mdlink';
	raw: string;
	text: string;
	uri: string;
	valid: boolean;
}

interface MentionSegment {
	type: 'mention';
	raw: string;
	text: string;
	handle: string;
}

interface TagSegment {
	type: 'tag';
	raw: string;
	text: string;
	tag: string;
}

export type PreliminarySegment =
	| TextSegment
	| EscapeSegment
	| LinkSegment
	| MdLinkSegment
	| MentionSegment
	| TagSegment;

export interface PreliminaryRichText {
	segments: PreliminarySegment[];
	links: string[];
}

const enum CharCode {
	ESCAPE = 92,

	AT = 64,
	TAG = 35,

	OSQUARE = 91,
	ESQUARE = 93,
	OPAREN = 40,
	EPAREN = 41,

	NEWLINE = 10,
	SPACE = 32,

	COLON = 58,
	FSLASH = 47,

	COMMA = 44,
	DOT = 46,
	SEMICOLON = 59,

	H = 104,
	P = 112,
	S = 115,
	T = 116,
}

const WS_RE = / +(?=\n)/g;
export const EOF_WS_RE = /\s+$| +(?=\n)/g;

const MENTION_RE = /[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+)/y;
const MDLINK_RE = /(.+?)\]\((.+?)\)/y;

const ESCAPE_SEGMENT: EscapeSegment = { type: 'escape', raw: '\\', text: '' };

export const parseRt = (source: string): PreliminaryRichText => {
	const segments: PreliminarySegment[] = [];
	const links: string[] = [];

	const c = String.prototype.charCodeAt.bind(source);

	let tmp: number;
	let secure: boolean = false;

	for (let idx = 0, len = source.length; idx < len; ) {
		const look = c(idx);

		jump: if (look === CharCode.AT) {
			MENTION_RE.lastIndex = idx + 1;
			const match = MENTION_RE.exec(source);

			if (!match) {
				break jump;
			}

			const handle = match[0];
			const raw = '@' + handle;

			idx = idx + 1 + handle.length;
			segments.push({ type: 'mention', raw: raw, text: raw, handle: handle });

			continue;
		} else if (look === CharCode.TAG) {
			let end = idx + 1;
			for (; end < len; end++) {
				const char = c(end);

				if (char === CharCode.SPACE || char === CharCode.NEWLINE) {
					break;
				}
			}

			if (end === idx + 1) {
				break jump;
			}

			const tag = source.slice(idx + 1, end);
			const raw = '#' + tag;

			idx = end;
			segments.push({ type: 'tag', raw: raw, text: raw, tag: tag });

			continue;
		} else if (look === CharCode.OSQUARE) {
			MDLINK_RE.lastIndex = idx + 1;
			const match = MDLINK_RE.exec(source);

			if (!match) {
				break jump;
			}

			const raw = '[' + match[0];
			const text = match[1];
			const uri = match[2];

			const urlp = safeUrlParse(uri);

			idx = idx + raw.length;
			segments.push({ type: 'mdlink', raw: raw, text: text, uri: uri, valid: urlp !== null });

			if (urlp) {
				links.push(urlp.href);
			}

			continue;
		}

		jump: {
			let end = idx + 1;

			for (; end < len; end++) {
				const char = c(end);

				if (char === CharCode.AT || char === CharCode.TAG || char === CharCode.OSQUARE) {
					const prev = c(end - 1);

					if (prev === CharCode.ESCAPE) {
						// Commit the string early
						const raw = source.slice(idx, end - 1);
						const text = raw.replace(WS_RE, '');

						idx = end;
						segments.push({ type: 'text', raw: raw, text: text });
						segments.push(ESCAPE_SEGMENT);

						continue;
					}

					if (prev !== CharCode.SPACE && prev !== CharCode.NEWLINE) {
						continue;
					}

					break;
				}

				// Auto-link detection
				if (
					char === CharCode.COLON &&
					// we have 3 succeeding characters, beware that end is still on colon
					len - end >= 3 + 1 &&
					// the first two is //
					c(end + 1) === CharCode.FSLASH &&
					c(end + 2) === CharCode.FSLASH &&
					// the third is not a whitespace
					(tmp = c(end + 3)) !== CharCode.SPACE &&
					tmp !== CharCode.NEWLINE &&
					// either:
					// we have 5 preceeding characters
					((secure =
						end - idx >= 5 &&
						// the 5 characters are `https` (reverse-order)
						c(end - 1) === CharCode.S &&
						c(end - 2) === CharCode.P &&
						c(end - 3) === CharCode.T &&
						c(end - 4) === CharCode.T &&
						c(end - 5) === CharCode.H) ||
						// or, we have 4 preceeding characters
						(end - idx >= 4 &&
							// the 4 characters are `http` (reverse-order)
							c(end - 1) === CharCode.P &&
							c(end - 2) === CharCode.T &&
							c(end - 3) === CharCode.T &&
							c(end - 4) === CharCode.H))
				) {
					const start = end - (secure ? 5 : 4);

					// Consume the :// we just had above
					end = end + 3;

					// Iterate until we get a whitespace character
					for (; end < len; end++) {
						const char = c(end);

						if (char === CharCode.SPACE || char === CharCode.NEWLINE) {
							break;
						}
					}

					// Trim the URL
					for (; end >= start; end--) {
						const char = c(end - 1);

						// If we encounter a dot, comma, or a semicolon, save it and continue
						if (char === CharCode.DOT || char === CharCode.COMMA || char === CharCode.SEMICOLON) {
							continue;
						}

						// If we encounter a closing paren, save it but break out of the loop
						if (char === CharCode.EPAREN) {
							end--;
						}

						// Otherwise, break out of the loop
						break;
					}

					if (start > idx) {
						const raw = source.slice(idx, start);
						const text = raw.replace(WS_RE, '');

						segments.push({ type: 'text', raw: raw, text: text });
					}

					{
						const raw = source.slice(start, end);

						idx = end;
						segments.push({ type: 'link', raw: raw, text: toShortUrl(raw), uri: raw });
						links.push(raw);
					}

					if (idx === len) {
						break jump;
					}

					continue;
				}
			}

			const raw = source.slice(idx, end);
			const text = raw.replace(end === len ? EOF_WS_RE : WS_RE, '');

			idx = end;
			segments.push({ type: 'text', raw: raw, text: text });

			continue;
		}
	}

	return { segments, links };
};

const cachedLength = new WeakMap<PreliminaryRichText, number>();

export const getRtText = (rt: PreliminaryRichText): string => {
	const segments = rt.segments;
	let str = '';

	for (let i = 0, ilen = segments.length; i < ilen; i++) {
		const segment = segments[i];
		str += segment.text;
	}

	return str;
};

export const getRtLength = (rt: PreliminaryRichText): number => {
	let len = cachedLength.get(rt);

	if (len === undefined) {
		const text = getRtText(rt);
		cachedLength.set(rt, (len = graphemeLen(text)));
	}

	return len;
};

const encoder = new TextEncoder();

const getUtf8Length = (str: string): number => {
	return asciiLen(str) ?? encoder.encode(str).byteLength;
};

export const finalizeRt = async (uid: DID, rt: PreliminaryRichText) => {
	const agent = await multiagent.connect(uid);

	const segments = rt.segments;

	const text = getRtText(rt);
	const facets: Facet[] = [];

	let utf8Length = 0;

	for (let i = 0, ilen = segments.length; i < ilen; i++) {
		const segment = segments[i];

		const index = {
			byteStart: utf8Length,
			byteEnd: (utf8Length += getUtf8Length(text)),
		};

		const type = segment.type;

		if (type === 'link' || type === 'mdlink') {
			facets.push({
				index: index,
				features: [{ $type: 'app.bsky.richtext.facet#link', uri: segment.uri }],
			});
		} else if (type === 'mention') {
			try {
				const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
					params: {
						handle: segment.handle,
					},
				});

				const did = response.data.did;

				facets.push({
					index: index,
					features: [{ $type: 'app.bsky.richtext.facet#mention', did: did }],
				});
			} catch (err) {
				if (err instanceof XRPCError && err.error === 'InvalidRequest') {
					continue;
				}

				throw err;
			}
		} else if (type === 'tag') {
			facets.push({
				index: index,
				features: [{ $type: 'app.bsky.richtext.facet#tag', tag: segment.tag }],
			});
		}
	}

	return { text: text, facets: facets };
};
