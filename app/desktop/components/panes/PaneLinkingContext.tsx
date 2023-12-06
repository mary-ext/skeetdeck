import { type JSX, lazy } from 'solid-js';

import {
	type LinkingContextObject,
	LINK_EXTERNAL,
	LINK_FEED_LIKED_BY,
	LINK_FEED,
	LINK_LIST,
	LINK_POST_LIKED_BY,
	LINK_POST_REPOSTED_BY,
	LINK_POST,
	LINK_PROFILE_FOLLOWERS,
	LINK_PROFILE_FOLLOWS,
	LINK_PROFILE,
	LinkingContext,
} from '~/com/components/Link.tsx';

import { usePaneContext } from './PaneContext.tsx';

const FeedLikedByPaneDialog = lazy(() => import('./dialogs/FeedLikedByPaneDialog.tsx'));
const FeedPaneDialog = lazy(() => import('./dialogs/FeedPaneDialog.tsx'));
const ListPaneDialog = lazy(() => import('./dialogs/ListPaneDialog.tsx'));
const PostLikedByPaneDialog = lazy(() => import('./dialogs/PostLikedByPaneDialog.tsx'));
const PostRepostedByPaneDialog = lazy(() => import('./dialogs/PostRepostedByPaneDialog.tsx'));
const ProfileFollowersPaneDialog = lazy(() => import('./dialogs/ProfileFollowersPaneDialog.tsx'));
const ProfileFollowsPaneDialog = lazy(() => import('./dialogs/ProfileFollowsPaneDialog.tsx'));
const ProfilePaneDialog = lazy(() => import('./dialogs/ProfilePaneDialog.tsx'));
const ThreadPaneDialog = lazy(() => import('./dialogs/ThreadPaneDialog.tsx'));

export interface PaneLinkingContextProps {
	children: JSX.Element;
}

export const PaneLinkingContextProvider = (props: PaneLinkingContextProps) => {
	const { openModal } = usePaneContext();

	const navigate: LinkingContextObject['navigate'] = (to, alt) => {
		const type = to.type;

		if (alt) {
			return;
		}

		if (type === LINK_FEED) {
			return openModal(() => <FeedPaneDialog {...to} />);
		}

		if (type === LINK_FEED_LIKED_BY) {
			return openModal(() => <FeedLikedByPaneDialog {...to} />);
		}

		if (type === LINK_LIST) {
			return openModal(() => <ListPaneDialog {...to} />);
		}

		if (type === LINK_POST) {
			return openModal(() => <ThreadPaneDialog {...to} />);
		}

		if (type === LINK_POST_LIKED_BY) {
			return openModal(() => <PostLikedByPaneDialog {...to} />);
		}

		if (type === LINK_POST_REPOSTED_BY) {
			return openModal(() => <PostRepostedByPaneDialog {...to} />);
		}

		if (type === LINK_PROFILE) {
			return openModal(() => <ProfilePaneDialog {...to} />);
		}

		if (type === LINK_PROFILE_FOLLOWERS) {
			return openModal(() => <ProfileFollowersPaneDialog {...to} />);
		}

		if (type === LINK_PROFILE_FOLLOWS) {
			return openModal(() => <ProfileFollowsPaneDialog {...to} />);
		}
	};

	const linkContext: LinkingContextObject = {
		navigate: navigate,
		render(props) {
			const to = props.to;

			if (to.type === LINK_EXTERNAL && !props.disabled) {
				return (
					<a
						{...props}
						// @ts-expect-error
						to={null}
						href={/* @once */ to.url}
						target="_blank"
						rel="noopener noreferrer nofollow"
					/>
				);
			}

			// @ts-expect-error
			return <button {...props} to={null} onClick={() => navigate(to, false)} />;
		},
	};

	return <LinkingContext.Provider value={linkContext}>{props.children}</LinkingContext.Provider>;
};
