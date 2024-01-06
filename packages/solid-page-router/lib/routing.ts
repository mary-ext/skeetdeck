import type { Component, JSX } from 'solid-js';

const TRIM_PATH_RE = /^\/+|(\/)\/+$/g;
const OPTIONAL_TEST_RE = /(\/?\:[^\/]+)\?/;
const OPTIONAL_MATCH_RE = /^(\/\:[^\/]+)\?/;

export const normalizePath = (path: string, omitSlash: boolean = false) => {
	const s = path.replace(TRIM_PATH_RE, '$1');
	return s ? (omitSlash || /^[?#]/.test(s) ? s : '/' + s) : '';
};

export const joinPaths = (a: string, b: string): string => {
	return normalizePath(a).replace(/\/*(\*.*)?$/g, '') + normalizePath(b);
};

export const expandOptionals = (pattern: string): string[] => {
	let match = OPTIONAL_TEST_RE.exec(pattern);
	if (!match) {
		return [pattern];
	}

	let prefix = pattern.slice(0, match.index);
	let suffix = pattern.slice(match.index + match[0].length);
	const prefixes: string[] = [prefix, (prefix += match[1])];

	// This section handles adjacent optional params. We don't actually want all permuations since
	// that will lead to equivalent routes which have the same number of params. For example
	// `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
	// discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
	// ensure predictability where earlier params have precidence.
	while ((match = OPTIONAL_MATCH_RE.exec(suffix))) {
		prefixes.push((prefix += match[1]));
		suffix = suffix.slice(match[0].length);
	}

	return expandOptionals(suffix).reduce<string[]>(
		(res, expansion) => [...res, ...prefixes.map((p) => p + expansion)],
		[],
	);
};

export const scoreRoute = (route: Route): number => {
	const [pattern, splat] = route.pattern.split('/*', 2);
	const segments = pattern.split('/').filter(Boolean);

	return segments.reduce(
		(score, segment) => score + (segment.startsWith(':') ? 2 : 3),
		segments.length - (splat === undefined ? 0 : 1),
	);
};

export const createRoutes = (def: RouteDefinition, base: string = ''): Route[] => {
	const { component, children } = def;
	const isLeaf = !children || (Array.isArray(children) && !children.length);

	const acc: Route[] = [];
	const expandedOptionals = expandOptionals(def.path);

	for (let i = 0, il = expandedOptionals.length; i < il; i++) {
		const originalPath = expandedOptionals[i];

		const path = joinPaths(base, originalPath);
		const pattern = isLeaf ? path : path.split('/*', 1)[0];

		acc.push({
			key: def,
			component,
			originalPath,
			pattern,
			matcher: createMatcher(pattern, !isLeaf),
		});
	}

	return acc;
};

export const createBranch = (routes: Route[], index: number = 0): Branch => {
	return {
		routes,
		score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
		matcher(location) {
			const matches: RouteMatch[] = [];

			for (let i = routes.length - 1; i >= 0; i--) {
				const route = routes[i];
				const match = route.matcher(location);

				if (!match) {
					return null;
				}

				matches.unshift({ ...match, route });
			}

			return matches;
		},
	};
};

export const getRouteMatches = (branches: Branch[], location: string): RouteMatch[] => {
	for (let i = 0, il = branches.length; i < il; i++) {
		const match = branches[i].matcher(location);

		if (match) {
			return match;
		}
	}

	return [];
};

export const createBranches = (
	defs: RouteDefinition[],
	base: string = '',
	stack: Route[] = [],
	branches: Branch[] = [],
): Branch[] => {
	for (let i = 0, il = defs.length; i < il; i++) {
		const def = defs[i];
		const routes = createRoutes(def, base);

		for (let j = 0, jl = routes.length; j < jl; j++) {
			const route = routes[j];

			const children = def.children;

			stack.push(route);

			if (Array.isArray(children) && children.length > 0) {
				createBranches(children, route.pattern, stack, branches);
			} else {
				const branch = createBranch([...stack], branches.length);
				branches.push(branch);
			}

			stack.pop();
		}
	}

	// Stack will be empty on final return
	return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
};

export const createMatcher = (path: string, partial?: boolean) => {
	const [pattern, splat] = path.split('/*', 2);
	const segments = pattern.split('/').filter(Boolean);
	const len = segments.length;

	return (location: string): PathMatch | null => {
		const locSegments = location.split('/').filter(Boolean);
		const lenDiff = locSegments.length - len;

		if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
			return null;
		}

		const match: PathMatch = {
			path: len ? '' : '/',
			params: {},
		};

		for (let i = 0; i < len; i++) {
			const segment = segments[i];
			const locSegment = locSegments[i];
			const dynamic = segment[0] === ':';
			const key = dynamic ? segment.slice(1) : segment;

			if (dynamic) {
				match.params[key] = locSegment;
			}

			match.path += `/${locSegment}`;
		}

		if (splat) {
			const remainder = lenDiff ? locSegments.slice(-lenDiff).join('/') : '';
			match.params[splat] = remainder;
		}

		return match;
	};
};

export type Params = Record<string, string>;

export interface RouteComponentProps {
	params: Params;
	children?: JSX.Element;
}

export interface RouteDefinition {
	path: string;
	component?: Component<RouteComponentProps>;
	children?: RouteDefinition[];
}

export interface Route {
	key: unknown;
	originalPath: string;
	pattern: string;
	component?: Component<RouteComponentProps>;
	matcher: (location: string) => PathMatch | null;
}

export interface Branch {
	routes: Route[];
	score: number;
	matcher: (location: string) => RouteMatch[] | null;
}

export interface PathMatch {
	params: Params;
	path: string;
}

export interface RouteMatch extends PathMatch {
	route: Route;
}
