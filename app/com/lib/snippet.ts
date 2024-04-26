import type { AppBskyEmbedExternal } from '@mary/bluesky-client/lexicons';

export const enum SnippetType {
	LINK,
	BLUESKY_GIF,
	IFRAME,
}

export const enum SnippetSource {
	YOUTUBE,
}

interface LinkSnippet {
	t: SnippetType.LINK;
	/** Domain name */
	d?: string;
}

interface BlueskyGifSnippet {
	t: SnippetType.BLUESKY_GIF;
	/** Video URL */
	u: string;
	/** Aspect ratio */
	r: string;
	/** Alt text description */
	d: string;
}

interface IframeSnippet {
	t: SnippetType.IFRAME;
	/** Source type */
	s: SnippetSource;
	/** Source domain */
	d: string;
	/** Iframe URL */
	u: string;
	/** Aspect ratio */
	r: string;
}

export type Snippet = LinkSnippet | BlueskyGifSnippet | IframeSnippet;

export const detectSnippet = (
	link: Pick<AppBskyEmbedExternal.ViewExternal, 'uri' | 'description'>,
): Snippet => {
	const url = link.uri;

	let u: URL;
	let m: RegExpExecArray | null | undefined;

	try {
		u = new URL(url);

		if (u.protocol !== 'https:' && u.protocol !== 'http:') {
			return { t: SnippetType.LINK };
		}
	} catch {
		return { t: SnippetType.LINK };
	}

	const h = u.host;
	const p = u.pathname;
	const q = u.searchParams;

	const d = h.startsWith('www.') ? h.slice(4) : h;

	if (d === 'media.tenor.com') {
		// Bluesky GIFs
		if ((m = /\/([^/]+?AAAAC)\/([^/]+?)\?hh=(\d+?)&ww=(\d+?)$/.exec(url))) {
			const id = m[1].replace(/AAAAC$/, 'AAAP3');
			const file = m[2].replace(/\.gif$/, '.webm');

			const width = m[4];
			const height = m[3];

			return {
				t: SnippetType.BLUESKY_GIF,
				u: `https://t.gifs.bsky.app/${id}/${file}`,
				r: `${width}/${height}`,
				d: link.description.replace(/^ALT: /, ''),
			};
		}
	} else if (d === 'youtube.com' || d === 'm.youtube.com' || d === 'music.youtube.com') {
		// YouTube iframe
		if (p === '/watch') {
			const videoId = q.get('v');
			const seek = q.get('t') || 0;

			return {
				t: SnippetType.IFRAME,
				s: SnippetSource.YOUTUBE,
				d: d,
				u: `https://www.youtube-nocookie.com/embed/${videoId}?start=${seek}&autoplay=1&playsinline=1`,
				r: `16/9`,
			};
		}
		// else if ((m = /^\/shorts\/([^/]+?)$/.exec(p))) {
		// 	const videoId = m[1];

		// 	return {
		// 		t: SnippetType.IFRAME,
		// 		s: SnippetSource.YOUTUBE,
		// 		d: d,
		// 		u: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1`,
		// 		r: `9/16`,
		// 	};
		// }
	} else if (d === 'youtu.be') {
		// YouTube iframe
		if ((m = /^\/([^/]+?)$/.exec(p))) {
			const videoId = m[1];

			return {
				t: SnippetType.IFRAME,
				s: SnippetSource.YOUTUBE,
				d: d,
				u: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1`,
				r: `16/9`,
			};
		}
	}

	{
		// Link snippet, always matches
		return {
			t: SnippetType.LINK,
			d: d,
		};
	}
};
