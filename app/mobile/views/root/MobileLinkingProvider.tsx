import type { JSX } from 'solid-js';

import {
	type Linking,
	type LinkingContextObject,
	LinkingContext,
	LINK_EXTERNAL,
	LINK_POST,
	LINK_PROFILE,
} from '~/com/components/Link';

export interface MobileLinkingProviderProps {
	children: JSX.Element;
}

export const MobileLinkingProvider = (props: MobileLinkingProviderProps) => {
	const resolve = (to: Linking) => {
		const type = to.type;

		if (type === LINK_POST) {
			return `/${to.actor}/${to.rkey}`;
		}
		if (type === LINK_PROFILE) {
			return `/${to.actor}`;
		}
	};

	const navigate: LinkingContextObject['navigate'] = (to, alt) => {};

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
				return <a {...props} to={null} href={resolved} />;
			}) as unknown as JSX.Element;
		},
	};

	return <LinkingContext.Provider value={context}>{props.children}</LinkingContext.Provider>;
};
