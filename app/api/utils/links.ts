export const BSKY_PROFILE_URL_RE = /\/profile\/([^\/]+)$/;
export const BSKY_POST_URL_RE = /\/profile\/([^\/]+)\/post\/([^\/]+)$/;
export const BSKY_FEED_URL_RE = /\/profile\/([^\/]+)\/feed\/([^\/]+)$/;
export const BSKY_LIST_URL_RE = /\/profile\/([^\/]+)\/lists\/([^\/]+)$/;

export const isBskyUrl = (url: string) => {
	try {
		const urli = new URL(url);
		const host = urli.host;

		return host === 'bsky.app' || host === 'staging.bsky.app';
	} catch {}

	return false;
};

export interface ExtractedAppLink {
	type: string;
	author: string;
	rkey: string;
}

export const extractAppLink = (url: string): ExtractedAppLink | null => {
	let match: RegExpExecArray | null;

	if (isBskyUrl(url)) {
		if ((match = BSKY_POST_URL_RE.exec(url))) {
			return { type: 'app.bsky.feed.post', author: match[1], rkey: match[2] };
		}

		if ((match = BSKY_FEED_URL_RE.exec(url))) {
			return { type: 'app.bsky.feed.generator', author: match[1], rkey: match[2] };
		}

		if ((match = BSKY_LIST_URL_RE.exec(url))) {
			return { type: 'app.bsky.graph.list', author: match[1], rkey: match[2] };
		}
	}

	return null;
};
