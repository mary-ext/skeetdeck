import type { JSX } from 'solid-js';

import {
	type Linking,
	type LinkingContextObject,
	LinkingContext,
	LINK_EXTERNAL,
	LINK_FEED_LIKED_BY,
	LINK_FEED,
	LINK_LIST,
	LINK_POST_LIKED_BY,
	LINK_POST_REPOSTED_BY,
	LINK_POST,
	LINK_PROFILE_EDIT,
	LINK_PROFILE_FEEDS,
	LINK_PROFILE_FOLLOWERS,
	LINK_PROFILE_FOLLOWS,
	LINK_PROFILE_LISTS,
	LINK_PROFILE,
} from '~/com/components/Link';

export interface MobileLinkingProviderProps {
	children: JSX.Element;
}

export const MobileLinkingProvider = (props: MobileLinkingProviderProps) => {
	const resolve = (to: Linking): string | (() => void) | undefined => {
		const type = to.type;

		if (type === LINK_FEED) {
			return `/${to.actor}/feeds/${to.rkey}`;
		}
		if (type === LINK_FEED_LIKED_BY) {
			return `/${to.actor}/feeds/${to.rkey}/likes`;
		}
		if (type === LINK_LIST) {
			return `/${to.actor}/lists/${to.rkey}`;
		}
		if (type === LINK_POST) {
			return `/${to.actor}/${to.rkey}`;
		}
		if (type === LINK_POST_LIKED_BY) {
			return `/${to.actor}/${to.rkey}/likes`;
		}
		if (type === LINK_POST_REPOSTED_BY) {
			return `/${to.actor}/${to.rkey}/reposts`;
		}
		if (type === LINK_PROFILE) {
			return `/${to.actor}`;
		}
		if (type === LINK_PROFILE_EDIT) {
			return `/settings/profile`;
		}
		if (type === LINK_PROFILE_FEEDS) {
			return `/${to.actor}/feeds`;
		}
		if (type === LINK_PROFILE_FOLLOWERS) {
			return `/${to.actor}/followers`;
		}
		if (type === LINK_PROFILE_FOLLOWS) {
			return `/${to.actor}/follows`;
		}
		if (type === LINK_PROFILE_LISTS) {
			return `/${to.actor}/lists`;
		}
	};

	const navigate: LinkingContextObject['navigate'] = (to, alt) => {
		const resolved = resolve(to);

		if (typeof resolved === 'string') {
			navigation.navigate(resolved);
		} else if (typeof resolved === 'function') {
			resolved();
		}
	};

	const context: LinkingContextObject = {
		navigate: navigate,
		render(props) {
			return (() => {
				const to = props.to;

				if (to.type === LINK_EXTERNAL) {
					const url = to.url;
					const valid = to.valid;

					// @ts-expect-error
					return <a {...props} to={null} href={url} target="_blank" rel="noopener noreferrer nofollow" />;
				}

				const resolved = resolve(to);

				// @ts-expect-error
				return <a {...props} to={null} href={typeof resolved === 'string' ? resolved : undefined} />;
			}) as unknown as JSX.Element;
		},
	};

	return <LinkingContext.Provider value={context}>{props.children}</LinkingContext.Provider>;
};
