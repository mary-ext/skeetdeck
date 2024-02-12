import { type JSX, createMemo, lazy, Suspense } from 'solid-js';

import { type MatchedRouteState, getMatchedRoute } from '@pkg/solid-navigation';

import { getAccountData, multiagent } from '~/api/globals/agent';

import { getEntryAt } from '../utils/router';

import CircularProgress from '~/com/components/CircularProgress';

import { Interactive } from '~/com/primitives/interactive';

import ExploreIcon from '~/com/icons/baseline-explore';
import ExploreOutlinedIcon from '~/com/icons/outline-explore';
import HomeIcon from '~/com/icons/baseline-home';
import HomeOutlinedIcon from '~/com/icons/outline-home';
import NotificationsIcon from '~/com/icons/baseline-notifications';
import NotificationsOutlinedIcon from '~/com/icons/outline-notifications';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { MobileLinkingProvider } from './root/MobileLinkingProvider';
import UnfoldMoreIcon from '~/com/icons/baseline-unfold-more';

const LoggedOutView = lazy(() => import('./LoggedOut'));

interface RootProps {
	children?: JSX.Element;
}

const Root = (props: RootProps) => {
	const route = createMemo(getMatchedRoute);

	const hasAccount = createMemo(() => multiagent.active !== undefined);
	const isMainRoutes = createMemo(() => !!route()?.def.meta?.main);
	const isNotFound = createMemo(() => route()?.def.meta?.name === 'NotFound');

	return (
		<MobileLinkingProvider>
			<div class="mx-auto flex min-h-screen max-w-md flex-col bg-background">
				<Suspense
					fallback={
						<div class="grid grow place-items-center">
							<CircularProgress />
						</div>
					}
				>
					<div class="flex min-h-0 grow flex-col">
						{(() => {
							if (hasAccount() || isNotFound()) {
								return props.children;
							}

							return <LoggedOutView />;
						})()}
					</div>
				</Suspense>

				{(() => {
					if (hasAccount() && isMainRoutes()) {
						return <MainNavbar route={route()!} />;
					}
				})()}
			</div>
		</MobileLinkingProvider>
	);
};

export default Root;

const enum MainTabs {
	HOME = 'Home',
	EXPLORE = 'Explore',
	NOTIFICATIONS = 'Notifications',
	ME = 'Me',
}

const MainRoutes = {
	[MainTabs.HOME]: '/',
	[MainTabs.EXPLORE]: '/explore',
	[MainTabs.NOTIFICATIONS]: '/notifications',
	[MainTabs.ME]: '/@me',
};

const MainNavbar = (props: { route: MatchedRouteState }) => {
	const active = () => props.route.def.meta!.name;

	const bindClick = (to: MainTabs) => {
		return () => {
			const from = active();

			if (from === to) {
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}

			const href = MainRoutes[to];

			if (to === MainTabs.HOME) {
				const prev = getEntryAt(-1);

				if (prev && new URL(prev.url!).pathname === href) {
					navigation.back();
					return;
				}
			}

			navigation.navigate(href, { history: from === MainTabs.HOME ? 'push' : 'replace' });
		};
	};

	return (
		<div class="sticky bottom-0 z-30 flex h-13 min-w-0 shrink-0 border-t border-divider bg-background text-primary">
			<MainNavbarItem
				label="Home"
				icon={HomeOutlinedIcon}
				iconActive={HomeIcon}
				active={() => active() === MainTabs.HOME}
				onClick={/* @once */ bindClick(MainTabs.HOME)}
			/>

			<MainNavbarItem
				label="Explore"
				icon={ExploreOutlinedIcon}
				iconActive={ExploreIcon}
				active={() => active() === MainTabs.EXPLORE}
				onClick={/* @once */ bindClick(MainTabs.EXPLORE)}
			/>

			<MainNavbarItem
				label="Notifications"
				icon={NotificationsOutlinedIcon}
				iconActive={NotificationsIcon}
				active={() => active() === MainTabs.NOTIFICATIONS}
				onClick={/* @once */ bindClick(MainTabs.NOTIFICATIONS)}
			/>

			<MainNavbarItem
				label="My Profile"
				icon={() => <UserAvatar />}
				active={() => active() === MainTabs.ME}
				onClick={/* @once */ bindClick(MainTabs.ME)}
			/>
		</div>
	);
};

type IconComponent = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => JSX.Element;

const tabButton = Interactive({
	class: 'flex grow basis-0 items-center justify-center text-2xl relative',
});

const MainNavbarItem = ({
	label,
	icon: DefaultIcon,
	iconActive: ActiveIcon,
	active,
	onClick,
}: {
	label: string;
	icon: IconComponent;
	iconActive?: IconComponent;
	active: () => boolean;
	onClick: () => void;
}) => {
	return (
		<button title={label} onClick={onClick} class={tabButton}>
			{(() => {
				const Icon = ActiveIcon && active() ? ActiveIcon : DefaultIcon;
				return <Icon />;
			})()}

			{(() => {
				if (active()) {
					return <div class="absolute bottom-0 h-1 w-8 rounded bg-accent"></div>;
				}
			})()}
		</button>
	);
};

const UserAvatar = () => {
	return (
		<div class="flex items-center">
			<div class="h-6 w-6 shrink-0 overflow-hidden rounded-full">
				{(() => {
					const account = getAccountData(multiagent.active);
					const avatar = account?.profile?.avatar;

					return <img src={avatar || DefaultUserAvatar} class="h-full w-full object-cover" />;
				})()}
			</div>

			<UnfoldMoreIcon class="text-base text-muted-fg" style="margin:0 -18px 0 2px" />
		</div>
	);
};
