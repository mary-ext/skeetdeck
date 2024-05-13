import { lazy, type JSX } from 'solid-js';

import { isLinkValid } from '~/api/richtext/renderer';

import { isCtrlKeyPressed, isElementAltClicked } from '~/utils/interaction';

import { openModal } from '~/com/globals/modals';

import {
	LINK_EXTERNAL,
	LINK_FEED,
	LINK_FEED_LIKED_BY,
	LINK_LIST,
	LINK_POST,
	LINK_POST_LIKED_BY,
	LINK_POST_REPOSTED_BY,
	LINK_PROFILE,
	LINK_PROFILE_EDIT,
	LINK_PROFILE_FEEDS,
	LINK_PROFILE_FOLLOWERS,
	LINK_PROFILE_FOLLOWS,
	LINK_PROFILE_LISTS,
	LINK_QUOTE,
	LINK_REPLY,
	LINK_TAG,
	LinkingContext,
	type LinkingContextObject,
} from '~/com/components/Link';

import { useComposer } from '../composer/ComposerContext';

import { usePaneContext } from './PaneContext';

const LinkWarningDialog = lazy(() => import('~/com/components/dialogs/LinkWarningDialog'));

export interface PaneLinkingProviderProps {
	children: JSX.Element;
}

const PaneDialogs = {
	[LINK_FEED]: lazy(() => import('./dialogs/FeedPaneDialog')),
	[LINK_FEED_LIKED_BY]: lazy(() => import('./dialogs/FeedLikedByPaneDialog')),
	[LINK_LIST]: lazy(() => import('./dialogs/ListPaneDialog')),
	[LINK_POST]: lazy(() => import('./dialogs/ThreadPaneDialog')),
	[LINK_POST_LIKED_BY]: lazy(() => import('./dialogs/PostLikedByPaneDialog')),
	[LINK_POST_REPOSTED_BY]: lazy(() => import('./dialogs/PostRepostedByPaneDialog')),
	[LINK_PROFILE]: lazy(() => import('./dialogs/ProfilePaneDialog')),
	[LINK_PROFILE_EDIT]: lazy(() => import('./dialogs/ProfileSettingsPaneDialog')),
	[LINK_PROFILE_FEEDS]: lazy(() => import('./dialogs/ProfileFeedsPaneDialog')),
	[LINK_PROFILE_FOLLOWERS]: lazy(() => import('./dialogs/ProfileFollowersPaneDialog')),
	[LINK_PROFILE_FOLLOWS]: lazy(() => import('./dialogs/ProfileFollowsPaneDialog')),
	[LINK_PROFILE_LISTS]: lazy(() => import('./dialogs/ProfileListsPaneDialog')),
	[LINK_TAG]: lazy(() => import('./dialogs/HashtagPaneDialog')),
};

export const PaneLinkingProvider = (props: PaneLinkingProviderProps) => {
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
			composer.show((state) => {
				const posts = state.posts;

				state.author = pane.uid;
				posts[posts.length - 1].record = `at://${to.actor}/app.bsky.feed.post/${to.rkey}`;
			});

			return;
		}

		if (type === LINK_REPLY) {
			composer.show((state) => {
				state.author = pane.uid;
				state.reply = `at://${to.actor}/app.bsky.feed.post/${to.rkey}`;
			});

			return;
		}
	};

	const linkContext: LinkingContextObject = {
		navigate: navigate,
		render(props) {
			return (() => {
				const to = props.to;

				if (to.type === LINK_EXTERNAL) {
					const url = to.url;
					const text = to.text;

					return (
						<a
							{...props}
							// @ts-expect-error
							to={null}
							href={url}
							data-href={url}
							data-text={text}
							target="_blank"
							rel="noopener noreferrer nofollow"
							onClick={handleLinkClick}
							onAuxClick={handleLinkClick}
						/>
					);
				}

				return (
					<span
						role="button"
						tabindex={0}
						{...props}
						// @ts-expect-error
						to={null}
						onClick={(ev) => isValidClick(ev) && navigate(to, isCtrlKeyPressed(ev))}
						onAuxClick={(ev) => ev.button === 1 && navigate(to, true)}
						onKeyDown={(ev) => isEnterPressed(ev) && navigate(to, isCtrlKeyPressed(ev))}
					/>
				);
			}) as unknown as JSX.Element;
		},
	};

	return <LinkingContext.Provider value={linkContext}>{props.children}</LinkingContext.Provider>;
};

const isValidClick = (ev: MouseEvent & { target: Element }) => {
	const selection = window.getSelection();
	if (selection === null || selection.type !== 'Line') {
		return true;
	}

	const closest = ev.target.closest('img');
	if (closest !== null) {
		selection.removeAllRanges();
		return true;
	}

	return false;
};

const isEnterPressed = (ev: KeyboardEvent) => {
	const key = ev.key;
	return key === 'Enter' || key === 'Space';
};

interface ExternalAnchorElement extends HTMLAnchorElement {
	_ignored?: boolean;
	_valid?: boolean;
}

const handleLinkClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (ev) => {
	const target = ev.currentTarget as ExternalAnchorElement;

	if (target._ignored || (ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)) {
		return;
	}

	let valid = target._valid;

	if (valid === undefined) {
		const text = target.dataset.text!;
		const href = target.dataset.href!;

		valid = target._valid = isLinkValid(href, text);
	}

	if (valid) {
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
