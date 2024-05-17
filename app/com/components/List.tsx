import { For, Match, Switch, type JSX } from 'solid-js';

import { getQueryErrorInfo } from '~/api/utils/query';

import { ifIntersect } from '~/utils/refs';

import { loadMoreBtn, loadNewBtn } from '../primitives/interactive';

import CircularProgress from './CircularProgress';
import GenericErrorView from './views/GenericErrorView';

export interface ListProps<T> {
	data?: T[];
	error?: unknown;
	render: (item: T, index: () => number) => JSX.Element;
	fallback?: JSX.Element;
	manualScroll?: boolean;
	hasNewData?: boolean;
	hasNextPage?: boolean;
	isRefreshing?: boolean;
	isFetchingNextPage?: boolean;
	onEndReached?: () => void;
	onRefresh?: () => void;
}

const List = <T,>(props: ListProps<T>) => {
	const render = props.render;

	const onEndReached = props.onEndReached;
	const onRefresh = props.onRefresh;

	return (
		<div class="flex flex-col">
			<Switch>
				<Match when={props.isRefreshing}>
					<div class="grid h-13 shrink-0 place-items-center border-b border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.hasNewData}>
					<button onClick={onRefresh} class={loadNewBtn}>
						{'Show new items'}
					</button>
				</Match>
			</Switch>

			<For each={props.data} fallback={(() => props.data && props.fallback) as unknown as JSX.Element}>
				{render}
			</For>

			<Switch>
				<Match when={props.error}>
					{(err) => (
						<GenericErrorView
							padded
							error={err()}
							onRetry={() => {
								const info = getQueryErrorInfo(err());

								if (info && info.pageParam === undefined) {
									onRefresh?.();
								} else {
									onEndReached?.();
								}
							}}
						/>
					)}
				</Match>

				<Match when={props.isRefreshing}>{null}</Match>

				<Match when={props.manualScroll && props.hasNextPage && !props.isFetchingNextPage}>
					<button onClick={onEndReached} class={loadMoreBtn}>
						{'Show more'}
					</button>
				</Match>

				<Match when={props.isFetchingNextPage || props.hasNextPage}>
					<div
						ref={ifIntersect(() => props.hasNextPage && !props.isFetchingNextPage, onEndReached)}
						class="grid h-13 shrink-0 place-items-center"
					>
						<CircularProgress />
					</div>
				</Match>

				<Match when={props.data}>
					<div class="grid h-13 shrink-0 place-items-center">
						<p class="text-sm text-muted-fg">{'End of list'}</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default List;
