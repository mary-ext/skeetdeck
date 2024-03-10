import { type JSX, createMemo, createEffect } from 'solid-js';

import { XRPCError } from '@mary/bluesky-client/xrpc';

import { type MatchedRouteState, getMatchedRoute } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import { MultiagentError } from '~/api/classes/multiagent';
import { getAccountData, multiagent } from '~/api/globals/agent';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';

import { getEntryAt } from '../utils/router';

import { Interactive } from '~/com/primitives/interactive';

import ExploreIcon from '~/com/icons/baseline-explore';
import ExploreOutlinedIcon from '~/com/icons/outline-explore';
import HomeIcon from '~/com/icons/baseline-home';
import HomeOutlinedIcon from '~/com/icons/outline-home';
import NotificationsIcon from '~/com/icons/baseline-notifications';
import NotificationsOutlinedIcon from '~/com/icons/outline-notifications';

import { type NavDrawerContextObject, NavDrawerContext } from '../components/main/NavDrawerContext';
import { MobileLinkingProvider } from '../components/main/MobileLinkingProvider';

import NavDrawer from '../components/main/NavDrawer';

interface RootProps {
	children?: JSX.Element;
}

const isCloseWatcherSupported = typeof CloseWatcher !== 'undefined';

const Root = (props: RootProps) => {
	let drawer: HTMLDialogElement;
	let watcher: CloseWatcher | undefined;

	const route = createMemo(getMatchedRoute);

	const hasAccount = createMemo(() => multiagent.active !== undefined);
	const isMainRoutes = createMemo(() => !!route()?.def.meta?.main);

	const drawerContext: NavDrawerContextObject = {
		open: () => {
			if (isCloseWatcherSupported) {
				if (watcher) {
					return;
				}

				watcher = new CloseWatcher();
				watcher.oncancel = () => {
					watcher = undefined;
					drawer.close();
				};
			}

			drawer.showModal();
		},
	};

	const profile = createQuery(() => {
		const uid = multiagent.active;

		return {
			enabled: uid !== undefined,
			queryKey: getProfileKey(uid!, uid!),
			queryFn: getProfile,
		};
	});

	createEffect(() => {
		let err = profile.error;
		let invalid = false;

		if (err) {
			if (err instanceof MultiagentError) {
				err = (err.cause as Error) || err;
			}

			if (err instanceof XRPCError) {
				invalid = err.kind === 'InvalidToken' || err.kind === 'ExpiredToken';
			}
		}
	});

	return (
		<MobileLinkingProvider>
			<NavDrawerContext.Provider value={drawerContext}>
				<dialog
					ref={drawer!}
					onClick={(ev) => {
						if (ev.target === drawer) {
							drawer.close();
						}
					}}
					onClose={
						isCloseWatcherSupported
							? (ev) => {
									if (ev.target === drawer) {
										if (watcher) {
											watcher.close();
											watcher = undefined;
										}
									}
								}
							: undefined
					}
					class="m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-transparent backdrop:bg-transparent"
					data-modal
				>
					<NavDrawer
						account={getAccountData(multiagent.active)}
						profile={profile.data}
						onClose={() => drawer.close()}
					/>
				</dialog>

				<div class="relative mx-auto flex min-h-screen max-w-md flex-col bg-background">
					{(() => {
						if (hasAccount() && isMainRoutes()) {
							return <MainNavbar route={route()!} />;
						}
					})()}

					<div class="flex min-h-0 grow flex-col">{props.children}</div>
				</div>
			</NavDrawerContext.Provider>
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
	[MainTabs.HOME]: '/home',
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
		<div
			class="sticky bottom-0 z-30 flex h-13 min-w-0 shrink-0 border-t border-divider bg-background text-primary"
			style="order:2"
		>
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
					return <div class="absolute bottom-0 h-1 w-8 rounded bg-accent"></div>;
				}
			})()}
		</button>
	);
};
