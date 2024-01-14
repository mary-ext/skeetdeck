import { type JSX, lazy, batch } from 'solid-js';

import { isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';

import { openModal } from '~/com/globals/modals.tsx';

import {
	type LinkingContextObject,
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
	LINK_QUOTE,
	LINK_REPLY,
	LinkingContext,
} from '~/com/components/Link.tsx';

import { useComposer } from '../composer/ComposerContext.tsx';

import { usePaneContext } from './PaneContext.tsx';

const LinkWarningDialog = lazy(() => import('~/com/components/dialogs/LinkWarningDialog.tsx'));

export interface PaneLinkingContextProps {
	children: JSX.Element;
}

const PaneDialogs = {
	[LINK_FEED]: lazy(() => import('./dialogs/FeedPaneDialog.tsx')),
	[LINK_FEED_LIKED_BY]: lazy(() => import('./dialogs/FeedLikedByPaneDialog.tsx')),
	[LINK_LIST]: lazy(() => import('./dialogs/ListPaneDialog.tsx')),
	[LINK_POST]: lazy(() => import('./dialogs/ThreadPaneDialog.tsx')),
	[LINK_POST_LIKED_BY]: lazy(() => import('./dialogs/PostLikedByPaneDialog.tsx')),
	[LINK_POST_REPOSTED_BY]: lazy(() => import('./dialogs/PostRepostedByPaneDialog.tsx')),
	[LINK_PROFILE]: lazy(() => import('./dialogs/ProfilePaneDialog.tsx')),
	[LINK_PROFILE_FEEDS]: lazy(() => import('./dialogs/ProfileFeedsPaneDialog.tsx')),
	[LINK_PROFILE_EDIT]: lazy(() => import('./dialogs/ProfileSettingsPaneDialog.tsx')),
	[LINK_PROFILE_FOLLOWERS]: lazy(() => import('./dialogs/ProfileFollowersPaneDialog.tsx')),
	[LINK_PROFILE_FOLLOWS]: lazy(() => import('./dialogs/ProfileFollowsPaneDialog.tsx')),
	[LINK_PROFILE_LISTS]: lazy(() => import('./dialogs/ProfileListsPaneDialog.tsx')),
};

export const PaneLinkingContextProvider = (props: PaneLinkingContextProps) => {
	const { pane, openModal } = usePaneContext();
	const composer = useComposer();

	const navigate: LinkingContextObject['navigate'] = (to, alt) => {
		const type = to.type;

		if (alt) {
			return;
		}

		// @ts-expect-error
		const PaneDialog = PaneDialogs[type];

		if (PaneDialog) {
			return openModal(() => <PaneDialog {...to} />);
		}

		if (type === LINK_QUOTE) {
			batch(() => {
				const posts = composer.state.posts;

				composer.open = true;
				composer.author = pane.uid;

				posts[posts.length - 1].record = `at://${to.actor}/app.bsky.feed.post/${to.rkey}`;
			});

			return;
		}

		if (type === LINK_REPLY) {
			batch(() => {
				composer.open = true;
				composer.author = pane.uid;

				composer.state.reply = `at://${to.actor}/app.bsky.feed.post/${to.rkey}`;
			});

			return;
		}
	};

	const linkContext: LinkingContextObject = {
		navigate: navigate,
		render(props) {
			return (() => {
				const to = props.to;

				if (to.type === LINK_EXTERNAL && !props.disabled) {
					const url = to.url;
					const valid = to.valid;

					return (
						<a
							{...props}
							// @ts-expect-error
							to={null}
							href={url}
							target="_blank"
							rel="noopener noreferrer nofollow"
							onClick={!valid ? handleInvalidLink : undefined}
							onAuxClick={!valid ? handleInvalidLink : undefined}
						/>
					);
				}

				return (
					// @ts-expect-error
					<button {...props} to={null} onClick={() => navigate(props.to, false)} />
				);
			}) as unknown as JSX.Element;
		},
	};

	return <LinkingContext.Provider value={linkContext}>{props.children}</LinkingContext.Provider>;
};

interface InvalidAnchorElement extends HTMLAnchorElement {
	_ignored?: boolean;
}

const handleInvalidLink: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (ev) => {
	const target = ev.currentTarget as InvalidAnchorElement;

	if (target._ignored || !isElementClicked(ev)) {
		return;
	}

	const alt = isElementAltClicked(ev);

	ev.preventDefault();
	openModal(() => (
		<LinkWarningDialog
			url={/* @once */ target.href}
			onConfirm={() => {
				try {
					target._ignored = true;
					target.dispatchEvent(new MouseEvent('click', { ctrlKey: alt, metaKey: alt }));
				} finally {
					target._ignored = false;
				}
			}}
		/>
	));
};
