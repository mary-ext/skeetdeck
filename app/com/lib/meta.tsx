import {
	createContext,
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
	useContext,
} from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

type TitleNode = Comment & { _render: () => string };

interface MetaContextValue {
	title(node: TitleNode): void;
}

const MetaContext = createContext<MetaContextValue>();

export interface MetaProviderProps {
	children?: JSX.Element;
}

export const MetaProvider = (props: MetaProviderProps) => {
	const [titles, setTitles] = createSignal<TitleNode[]>([]);

	const activeTitle = createMemo(() => {
		const $titles = titles();
		return $titles.length > 0 ? $titles[0] : undefined;
	});

	createEffect(() => {
		const $activeTitle = activeTitle();

		if ($activeTitle) {
			createEffect(() => {
				const result = $activeTitle._render();
				document.title = result;
			});
		}
	});

	const context: MetaContextValue = {
		title(node) {
			// 1. Push our new node into the array, sort them according to priority
			{
				const next = titles().concat(node);
				setTitles(next.sort(collateNode));
			}

			// 2. Add a cleanup that would remove our node on unmount
			onCleanup(() => {
				const array = titles();
				setTitles(array.toSpliced(array.indexOf(node), 1));
			});
		},
	};

	return <MetaContext.Provider value={context}>{props.children}</MetaContext.Provider>;
};

export interface TitleProps {
	template?: boolean;
	render: string | (() => string);
}

export const Title = (props: TitleProps) => {
	const context = useContext(MetaContext);

	const node = document.createComment('!solid-title') as TitleNode;
	node._render = () => {
		const $render = props.render;

		if (typeof $render === 'function') {
			return (node._render = $render)();
		}

		return $render;
	};

	onMount(() => {
		context!.title(node);
	});

	return node;
};

// Node document sort
const FOLLOWING = 4;
const CONTAINED_BY = 16;

const PRECEDING = 2;
const CONTAINS = 8;

const collateNode = (a: Node, b: Node) => {
	const position = a.compareDocumentPosition(b);

	if (position & (FOLLOWING | CONTAINED_BY)) {
		return 1;
	}

	if (position & (PRECEDING | CONTAINS)) {
		return -1;
	}

	return 0;
};
