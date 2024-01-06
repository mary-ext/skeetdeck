import {
	type JSX,
	Show,
	createComponent,
	createMemo,
	createRoot,
	createSignal,
	getOwner,
	resetErrorBoundaries,
	runWithOwner,
	on,
	untrack,
} from 'solid-js';
import { delegateEvents } from 'solid-js/web';

import {
	type Branch,
	type Params,
	type RouteDefinition,
	createBranches,
	getRouteMatches,
} from './routing.ts';

export { type RouteComponentProps, type RouteDefinition } from './routing.ts';

let configured = false;

export interface NavigateOptions {
	replace?: boolean;
	scroll?: boolean;
}

const createLocation = (path: () => string): Location => {
	const origin = new URL('http://s');
	const url = createMemo<URL>(
		(prev) => {
			const path_ = path();
			try {
				return new URL(path_, origin);
			} catch (err) {
				console.error(`Invalid path ${path_}`);
				return prev;
			}
		},
		origin,
		{
			equals: (a, b) => a.href === b.href,
		},
	);

	const pathname = createMemo(() => url().pathname);
	const search = createMemo(() => url().search);
	const hash = createMemo(() => url().hash);

	return {
		get pathname() {
			return pathname();
		},
		get search() {
			return search();
		},
		get hash() {
			return hash();
		},
		query: createMemoObject(
			createMemo(() => {
				search();
				return extractSearchParams(untrack(url));
			}),
		),
	};
};

const extractSearchParams = (url: URL): Params => {
	const params: Params = {};

	url.searchParams.forEach((value, key) => {
		params[key] = value;
	});

	return params;
};

const createMemoObject = <T extends Record<string | symbol, unknown>>(fn: () => T): T => {
	const map = new Map();
	const owner = getOwner();

	return new Proxy({} as T, {
		get(_, prop) {
			let memo = map.get(prop);
			if (memo === undefined) {
				map.set(prop, (memo = runWithOwner(owner, () => createMemo(() => fn()[prop]))));
			}

			return memo();
		},
	});
};

const getPathString = (loc: Path) => {
	return loc.pathname + loc.search + loc.hash;
};
const getCurrentLocation = () => {
	return getPathString(window.location);
};

const [branches, setBranches] = createSignal<Branch[]>([]);
const [reference, setReference] = createSignal(getCurrentLocation());
export const location = createRoot(() => createLocation(reference));

export const navigate = (to: string | number, { replace = false, scroll = true }: NavigateOptions = {}) => {
	if (typeof to === 'number') {
		history.go(to);
		return;
	}

	const current = reference();

	if (current !== to) {
		setReference(to);
		resetErrorBoundaries();

		history[replace ? 'replaceState' : 'pushState'](null, '', to);
		scrollToHash(window.location.hash, scroll);
	}
};

export const configureRouter = (routes: RouteDefinition[]) => {
	setBranches(createBranches(routes, ''));

	if (!configured) {
		configured = true;

		// Run delegated events first
		delegateEvents(['click']);

		window.addEventListener('popstate', () => {
			setReference(getCurrentLocation());
		});

		document.addEventListener('click', (ev) => {
			if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.altKey || ev.ctrlKey || ev.shiftKey) {
				return;
			}

			const path = ev.composedPath();
			let a: HTMLAnchorElement | undefined;
			for (let i = 0, il = path.length; i < il; i++) {
				const node = path[i];

				if (node instanceof HTMLAnchorElement) {
					a = node;
					break;
				}
			}

			if (!a || !a.hasAttribute('data-link')) {
				return;
			}

			const href = a.href;
			if (a.target || !href || a.hasAttribute('download')) {
				return;
			}

			const rel = a.getAttribute('rel')?.split(/\s+/);
			if (rel && rel.includes('external')) {
				return;
			}

			const url = new URL(href);
			if (url.origin !== window.location.origin) {
				return;
			}

			ev.preventDefault();
			navigate(getPathString(url), { replace: a.getAttribute('data-link') === 'replace' });
		});
	}
};

const scrollToHash = (hash: string, fallbackTop?: boolean) => {
	let el: Element | null | undefined;

	if (hash) {
		try {
			el = document.querySelector(hash);
		} catch {}
	}

	if (el) {
		el.scrollIntoView();
	} else if (fallbackTop) {
		window.scrollTo(0, 0);
	}
};

interface RouteContext {
	render: () => JSX.Element;
}

export interface NavigateProps {
	to: string;
}

export const Navigate = ({ to }: NavigateProps) => {
	navigate(to, { replace: true });
	return null;
};

export const Router = () => {
	const matches = createMemo(() => getRouteMatches(branches(), location.pathname));

	const params = createMemoObject(
		createMemo(() => {
			const m = matches();
			const params: Params = {};

			for (let i = 0; i < m.length; i++) {
				Object.assign(params, m[i].params);
			}

			return params;
		}),
	);

	// const disposers: (() => void)[] = [];
	let root: RouteContext | undefined;

	const routeStates = createMemo(
		on(matches, (nextMatches, prevMatches, prev: RouteContext[] | undefined) => {
			let equal = prevMatches && nextMatches.length === prevMatches.length;
			const next: RouteContext[] = [];

			for (let i = 0, len = nextMatches.length; i < len; i++) {
				const prevMatch = prevMatches && prevMatches[i];
				const nextMatch = nextMatches[i];

				if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
					next[i] = prev[i];
				} else {
					equal = false;

					// if (disposers[i]) {
					// disposers[i]();
					// }

					// createRoot((dispose) => {
					const { component } = nextMatch.route;
					const outlet = createOutlet(() => routeStates()[i + 1]);

					// disposers[i] = dispose;

					next[i] = {
						render: () => {
							if (component) {
								return createComponent(component, {
									params,
									get children() {
										return outlet();
									},
								});
							}

							return outlet();
						},
					};
					// });
				}
			}

			// disposers.splice(nextMatches.length).forEach((dispose) => dispose());

			if (prev && equal) {
				return prev;
			}

			root = next[0];
			return next;
		}),
	);

	return (
		<Show when={routeStates() && root} keyed>
			{(route) => route.render()}
		</Show>
	);
};

const createOutlet = (child: () => RouteContext | undefined) => {
	return () => (
		<Show when={child()} keyed>
			{(child) => child.render()}
		</Show>
	);
};

export interface Path {
	pathname: string;
	search: string;
	hash: string;
}

export interface Location extends Path {
	query: Params;
}

declare module 'solid-js' {
	namespace JSX {
		interface AnchorHTMLAttributes<T> {
			'data-link'?: 'push' | 'replace';
		}
	}
}
