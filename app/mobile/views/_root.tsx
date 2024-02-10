import { type JSX, createMemo, lazy, Suspense } from 'solid-js';

import type { MatchedRouteState } from '@pkg/solid-navigation';

import { multiagent } from '~/api/globals/agent';

import { getMatchedRoute } from '../globals/router';

import { getEntryAt } from '../utils/router';

import CircularProgress from '~/com/components/CircularProgress';

import { Interactive } from '~/com/primitives/interactive';

import ExploreIcon from '~/com/icons/baseline-explore';
import ExploreOutlinedIcon from '~/com/icons/outline-explore';
import HomeIcon from '~/com/icons/baseline-home';
import HomeOutlinedIcon from '~/com/icons/outline-home';
import NotificationsIcon from '~/com/icons/baseline-notifications';
import NotificationsOutlinedIcon from '~/com/icons/outline-notifications';

import { MobileLinkingProvider } from './root/MobileLinkingProvider';

const LoggedOutView = lazy(() => import('./LoggedOut.tsx'));

interface RootProps {
	children?: JSX.Element;
}

const Root = (props: RootProps) => {
	// Ignore `undefined` here because we've set up the router to always match.
	const route = createMemo(getMatchedRoute) as () => MatchedRouteState;

	const hasAccount = createMemo(() => multiagent.active !== undefined);
	const isMainRoutes = createMemo(() => !!route().def.meta?.main);
	const isNotFound = createMemo(() => route().def.meta?.name === 'NotFound');

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
}

const MainRoutes = {
	[MainTabs.HOME]: '/',
	[MainTabs.EXPLORE]: '/explore',
	[MainTabs.NOTIFICATIONS]: '/notifications',
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
					return <div class="absolute bottom-0 h-1 w-8 rounded-t bg-accent"></div>;
				}
			})()}
		</button>
	);
};
