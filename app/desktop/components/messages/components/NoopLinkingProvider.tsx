import { type JSX } from 'solid-js';

import { LINK_EXTERNAL, LinkingContext, type LinkingContextObject } from '~/com/components/Link';

import { handleLinkClick } from '../../panes/PaneLinkingProvider';

export interface NoopLinkingProviderProps {
	children: JSX.Element;
}

export const NoopLinkingProvider = (props: NoopLinkingProviderProps) => {
	const linkContext: LinkingContextObject = {
		navigate() {},
		render(props) {
			return (() => {
				const to = props.to;

				if (to.type === LINK_EXTERNAL) {
					const url = to.url;
					const text = to.text;

					return (
						<a
							href={url}
							data-href={url}
							data-text={text}
							target="_blank"
							rel="noopener noreferrer nofollow"
							onClick={handleLinkClick}
							onAuxClick={handleLinkClick}
							class="underline hover:decoration-2"
						>
							{props.children}
						</a>
					);
				}

				return <span>{props.children}</span>;
			}) as unknown as JSX.Element;
		},
	};

	return <LinkingContext.Provider value={linkContext}>{props.children}</LinkingContext.Provider>;
};
