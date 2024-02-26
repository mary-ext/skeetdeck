/* @refresh reload */

import { type Component, For, batch, createContext, createSignal, onCleanup, useContext } from 'solid-js';

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

interface MatchedRoute {
	id: string | undefined;
	def: RouteDefinition;
	params: Record<string, string>;
}

export interface MatchedRouteState extends MatchedRoute {
	id: string;
	single: boolean;
}

interface RouterState {
	active: string;
	views: Record<string, MatchedRouteState>;
	singles: Record<string, MatchedRouteState>;
}

interface ViewContextObject {
	route: MatchedRouteState;
	focusHandlers: (() => void)[];
	blurHandlers: (() => void)[];
}

let routes: InternalRouteDefinition[] | undefined;
let initialized = false;

const [state, setState] = createSignal<RouterState>({
	active: '',
	views: {},
	singles: {},
});

const ViewContext = createContext<ViewContextObject>();

export const configureRouter = (opts: RouterOptions) => {
	routes = opts.routes;
};

export const getMatchedRoute = () => {
	const current = state();
	const active = current.active;

	const match = current.singles[active] || current.views[active];

	if (match) {
		return match;
	}
};

export const UNSAFE_useViewContext = () => {
	return useContext(ViewContext)!;
};

export const useParams = <T extends Record<string, string>>() => {
	return useContext(ViewContext)!.route.params as T;
};

export const onFocus = (callback: () => void, runFirst = false) => {
	const focusHandlers = useContext(ViewContext)!.focusHandlers;

	if (runFirst) {
		callback();
	}

	focusHandlers.push(callback);

	onCleanup(() => {
		const index = focusHandlers.indexOf(callback);
		focusHandlers.splice(index, 1);
	});
};

export const onBlur = (callback: () => void) => {
	const blurHandlers = useContext(ViewContext)!.blurHandlers;

	blurHandlers.push(callback);

	onCleanup(() => {
		const index = blurHandlers.indexOf(callback);
		blurHandlers.splice(index, 1);
	});
};

const _matchRoute = (path: string): MatchedRoute | null => {
	for (let idx = 0, len = routes!.length; idx < len; idx++) {
		const route = routes![idx];

		const validate = route.validate;
		const pattern = (route._regex ||= buildPathRegex(route.path));

		const match = pattern.exec(path);

		if (!match || (validate && !validate(match.groups!))) {
			continue;
		}

		const params = match.groups!;

		let id: string | undefined;
		if (route.single) {
			id = '@' + idx;
			for (const param in params) {
				id += '\0' + params[param];
			}
		}

		return { id: id, def: route, params: params };
	}

	return null;
};

const dispatcher = new EventTarget();

export const RouterView = () => {
	if (!initialized) {
		initialized = true;

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
					single: !!matched.id,
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

			if (type === 'push' && destination.url === currentEntry.url) {
				evt.preventDefault();
				return;
			}

			const url = new URL(destination.url);
			const pathname = url.pathname;

			const matched = _matchRoute(pathname);

			if (!matched) {
				return;
			}

			let views = current.views;
			let singles = current.singles;

			evt.intercept({
				scroll: matched.id ? 'manual' : 'after-transition',
				async handler() {
					const nextEntry = navigation.currentEntry!;
					const nextKey = matched.id || nextEntry.id;

					const matchedState: MatchedRouteState = {
						...matched,
						id: nextKey,
						single: !!matched.id,
					};

					if (!matched.id) {
						if (type === 'push') {
							const entries = navigation.entries();
							const nextViews: Record<string, MatchedRouteState> = {};

							for (let idx = 0, len = entries.length; idx < len; idx++) {
								const entry = entries[idx];
								const id = entry.id;

								if (id in views) {
									nextViews[id] = views[id];
								}
							}

							nextViews[nextKey] = matchedState;
							views = nextViews;
						} else if (type === 'replace') {
							views = { ...views, [nextKey]: matchedState };
							delete views[current.active];
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

					batch(() => {
						dispatcher.dispatchEvent(new CustomEvent('b' + current.active));
						setState({ active: nextKey, views: views, singles: singles });
					});

					await Promise.resolve();

					if (!matched.id && (type === 'push' || type === 'replace')) {
						window.scrollTo({ top: 0, behavior: 'instant' });
					}

					dispatcher.dispatchEvent(new CustomEvent('a' + nextKey));
				},
			});
		});
	}

	const renderView = (matched: MatchedRouteState) => {
		const [active, setActive] = createSignal(true);

		const focusHandlers: (() => void)[] = [];
		const blurHandlers: (() => void)[] = [];

		const context: ViewContextObject = {
			route: matched,
			focusHandlers: focusHandlers,
			blurHandlers: blurHandlers,
		};

		const def = matched.def;
		const id = matched.id;

		const single = def.single;

		let storedHeight = 0;

		dispatcher.addEventListener('a' + id, () => {
			setActive(true);

			if (single) {
				window.scrollTo({ top: storedHeight, behavior: 'instant' });
			}

			for (let idx = 0, len = focusHandlers.length; idx < len; idx++) {
				const fn = focusHandlers[idx];
				fn();
			}
		});

		dispatcher.addEventListener('b' + id, () => {
			setActive(false);

			if (single) {
				storedHeight = document.documentElement.scrollTop;
			}

			for (let idx = 0, len = blurHandlers.length; idx < len; idx++) {
				const fn = blurHandlers[idx];
				fn();
			}
		});

		return (
			<Freeze freeze={!active()}>
				<ViewContext.Provider value={context}>
					<def.component />
				</ViewContext.Provider>
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

const buildPathRegex = (path: string) => {
	let source =
		'^' +
		path
			.replace(/\/*\*?$/, '')
			.replace(/^\/*/, '/')
			.replace(/[\\.*+^${}|()[\]]/g, '\\$&')
			.replace(/\/:([\w-]+)(\?)?/g, '/$2(?<$1>[^\\/]+)$2');

	source += path.endsWith('*')
		? path === '*' || path === '/*'
			? '(?<$>.*)$'
			: '(?:\\/(?<$>.+)|\\/*)$'
		: '\\/*$';

	return new RegExp(source, 'i');
};
