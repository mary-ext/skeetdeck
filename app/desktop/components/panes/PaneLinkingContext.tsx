import { type JSX, lazy } from 'solid-js';

import { LinkingType, type LinkingContextObject, LinkingContext } from '~/com/components/Link.tsx';

import { usePaneContext } from './PaneContext.tsx';

const FeedLikedByPaneDialog = lazy(() => import('./dialogs/FeedLikedByPaneDialog.tsx'));
const FeedPaneDialog = lazy(() => import('./dialogs/FeedPaneDialog.tsx'));
const ListPaneDialog = lazy(() => import('./dialogs/ListPaneDialog.tsx'));
const PostLikedByPaneDialog = lazy(() => import('./dialogs/PostLikedByPaneDialog.tsx'));
const PostRepostedByPaneDialog = lazy(() => import('./dialogs/PostRepostedByPaneDialog.tsx'));
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

		if (type === LinkingType.FEED) {
			return openModal(() => <FeedPaneDialog {...to} />);
		}

		if (type === LinkingType.FEED_LIKED_BY) {
			return openModal(() => <FeedLikedByPaneDialog {...to} />);
		}

		if (type === LinkingType.LIST) {
			return openModal(() => <ListPaneDialog {...to} />);
		}

		if (type === LinkingType.POST) {
			return openModal(() => <ThreadPaneDialog {...to} />);
		}

		if (type === LinkingType.POST_LIKED_BY) {
			return openModal(() => <PostLikedByPaneDialog {...to} />);
		}

		if (type === LinkingType.POST_REPOSTED_BY) {
			return openModal(() => <PostRepostedByPaneDialog {...to} />);
		}

		if (type === LinkingType.PROFILE) {
			return openModal(() => <ProfilePaneDialog {...to} />);
		}
	};

	const linkContext: LinkingContextObject = {
		navigate: navigate,
		render(props) {
			const to = props.to;

			if (to.type === LinkingType.EXTERNAL) {
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
