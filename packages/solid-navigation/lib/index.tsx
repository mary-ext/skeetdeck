/* @refresh reload */

import { type Component, For, createSignal, createSelector, createContext, useContext } from 'solid-js';

import { Freeze } from '@pkg/solid-freeze';

// `@types/dom-navigation` isn't declaring one.
declare var navigation: Navigation;

export interface RouteMeta {}

export interface RouteDefinition {
	path: string;
	component: Component;
	single?: boolean;
	meta?: RouteMeta;
	validate?: (params: Record<string, string>) => boolean;
}

interface InternalRouteDefinition extends RouteDefinition {
	_regex?: RegExp;
}

export interface RouterOptions {
	routes: RouteDefinition[];
}

export interface NavigateOptions {
	replace?: boolean;
	info?: unknown;
	state?: unknown;
}

interface MatchedRoute {
	id: string | undefined;
	route: RouteDefinition;
	params: Record<string, string>;
}

export interface MatchedRouteState extends MatchedRoute {
	id: string;
}

interface RouterState {
	active: string;
	views: Record<string, MatchedRouteState>;
	singles: Record<string, MatchedRouteState>;
}

export const createRouter = (opts: RouterOptions) => {
	const routes = opts.routes as InternalRouteDefinition[];

	const [state, setState] = createSignal<RouterState>({
		active: '',
		views: {},
		singles: {},
	});

	const RouteContext = createContext<MatchedRouteState>();

	const RouterView = () => {
		const isActive = createSelector(() => state().active);

		const renderView = (matched: MatchedRouteState) => {
			const Component = matched.route.component;
			const id = matched.id;

			return (
				<Freeze freeze={!isActive(id)}>
					<RouteContext.Provider value={matched}>
						<Component />
					</RouteContext.Provider>
				</Freeze>
			);
		};

		return (
			<>
				<For each={Object.values(state().views)}>{renderView}</For>
				<For each={Object.values(state().singles)}>{renderView}</For>
			</>
		);
	};

	const navigate = (to: string, options?: NavigateOptions) => {
		return navigation.navigate(to, { history: options?.replace ? 'replace' : 'push', state: options?.state });
	};

	const getMatchedRoute = () => {
		const current = state();
		const active = current.active;

		const match = current.singles[active] || current.views[active];

		if (match) {
			return match;
		}
	};

	const useParams = () => {
		return useContext(RouteContext)!.params;
	};

	const _matchRoute = (path: string): MatchedRoute | null => {
		for (let idx = 0, len = routes.length; idx < len; idx++) {
			const route = routes[idx];

			const validate = route.validate;
			const pattern = (route._regex ||= buildPathRegex(route.path));

			const match = pattern.exec(path);

			if (!match || (validate && !validate(match.groups!))) {
				continue;
			}

			const params = match.groups!;

			let id: string | undefined;
			if (route.single) {
				id = '@' + route.path;
				for (const param in params) {
					id += '\0' + params[param];
				}
			}

			return { id, route, params };
		}

		return null;
	};

	{
		const currentEntry = navigation.currentEntry!;

		const url = new URL(currentEntry.url!);
		const pathname = url.pathname;

		const matched = _matchRoute(pathname);

		if (matched) {
			const nextKey = matched.id || currentEntry.id;

			const matchedState: MatchedRouteState = {
				...matched,
				id: nextKey,
			};

			const isSingle = !!matched.id;
			const next: Record<string, MatchedRouteState> = { [nextKey]: matchedState };

			setState({
				active: nextKey,
				views: isSingle ? {} : next,
				singles: isSingle ? next : {},
			});
		}
	}

	navigation.addEventListener('navigate', (evt) => {
		const destination = evt.destination;

		if (
			!evt.canIntercept ||
			evt.hashChange ||
			evt.downloadRequest !== null /* || !destination.sameDocument */
		) {
			return;
		}

		const current = state();
		const currentEntry = navigation.currentEntry!;

		const type = evt.navigationType;

		const url = new URL(destination.url);
		const pathname = url.pathname;

		const matched = _matchRoute(pathname);

		if (!matched) {
			return;
		}

		let views = current.views;
		let singles = current.singles;

		if (type === 'push' || type === 'replace') {
			const entries = navigation.entries();
			const startIndex = currentEntry.index + (type === 'push' ? 1 : 0);

			views = { ...views };

			for (let idx = startIndex, len = entries.length; idx < len; idx++) {
				const entry = entries[idx];
				delete views[entry.id];
			}
		}

		evt.intercept({
			async handler() {
				const nextEntry = navigation.currentEntry!;
				const nextKey = matched.id || nextEntry.id;

				const matchedState: MatchedRouteState = {
					...matched,
					id: nextKey,
				};

				if (!matched.id) {
					if (type === 'push' || type === 'replace') {
						views[nextKey] = matchedState;
					} else if (type === 'traverse') {
						if (!(nextKey in views)) {
							views = { ...views, [nextKey]: matchedState };
						}
					} else {
						// @todo: should we handle reload?
					}
				} else {
					if (!(nextKey in singles)) {
						singles = { ...singles, [nextKey]: matchedState };
					}
				}

				setState({ active: nextKey, views: views, singles: singles });
			},
		});
	});

	// createEffect(() => {
	// 	console.log(state());
	// });

	return { RouterView, getMatchedRoute, navigate, useParams };
};

const PATTERN_RE = /(:([\w]+))/g;

const buildPathRegex = (pattern: string) => {
	const splat = pattern.split(PATTERN_RE);

	let re = escapeRegex(splat[0]);
	for (let idx = 1, len = splat.length; idx < len; idx += 3) {
		const name = splat[idx + 1];
		const rest = splat[idx + 2];

		re += `(?<${name})${escapeRegex(rest)}`;
	}

	return new RegExp(`^${re}$`, 'i');
};

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

const escapeRegex = (str: string) => {
	return str.replace(ESCAPE_RE, '\\$&');
};
