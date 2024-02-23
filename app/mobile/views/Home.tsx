import { For, batch, createEffect, createMemo, createSignal } from 'solid-js';

import { onBlur, onFocus } from '@pkg/solid-navigation';
import { makeEventListener } from '@solid-primitives/event-listener';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { preferences } from '../globals/settings';

import { useEntryState } from '../utils/router';

import TimelineList from '~/com/components/lists/TimelineList';
import Tab from '~/com/components/Tab';

import ViewHeader from '../components/ViewHeader';

import ValidatedKeepAlive from '../components/ValidatedKeepAlive';

const HomeView = () => {
	const [state, setState] = useEntryState<{ uri?: At.Uri }>();
	const [uri, setUri] = createSignal(state().uri);

	const setTab = (next: At.Uri | undefined) => {
		if (uri() === next) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		batch(() => {
			setUri(next);
			setState({ uri: next });
		});
	};

	const pinnedFeeds = createMemo(() => {
		return preferences.feeds.saved.filter((feed) => feed.pinned);
	});

	const hasPinnedFeeds = () => pinnedFeeds().length > 0;

	createEffect(() => {
		const $uri = uri();

		if ($uri && !pinnedFeeds().some((feed) => feed.uri === $uri)) {
			setUri(undefined);
		}
	});

	return (
		<div class="contents">
			<div
				ref={(node) => {
					const style = node.style;

					createEffect(() => {
						if (hasPinnedFeeds()) {
							let curr = window.scrollY;
							let active = true;
							let minimal = false;

							onFocus(() => (active = true));
							onBlur(() => (active = false));

							makeEventListener(window, 'scroll', () => {
								if (!active) {
									return;
								}

								let next = window.scrollY;

								if (curr === next) {
									// do nothing
								} else if (next > 53 && curr <= next) {
									if (!minimal) {
										style.translate = '0 -53px';
										minimal = true;
									}
								} else {
									if (minimal) {
										style.translate = '';
										minimal = false;
									}
								}

								curr = next;
							});
						}
					});
				}}
				class="sticky top-0 z-30 bg-background transition-all"
			>
				<ViewHeader main title="Home" fixed={hasPinnedFeeds()} borderless={hasPinnedFeeds()} />

				{hasPinnedFeeds() && (
					<div class="flex h-13 shrink-0 overflow-x-auto border-b border-divider">
						<Tab active={uri() === undefined} onClick={() => setTab(undefined)}>
							Following
						</Tab>

						<For each={pinnedFeeds()}>
							{(feed) => (
								<Tab active={uri() === feed.uri} onClick={() => setTab(feed.uri)}>
									{feed.name}
								</Tab>
							)}
						</For>
					</div>
				)}
			</div>

			<ValidatedKeepAlive
				key={uri()}
				valid={[undefined, ...pinnedFeeds().map((feed) => feed.uri)]}
				render={(uri) => {
					return (
						<TimelineList
							uid={multiagent.active!}
							params={
								uri
									? {
											type: 'feed',
											uri: uri,
											showQuotes: true,
											showReplies: true,
											showReposts: true,
										}
									: {
											type: 'home',
											algorithm: 'reverse-chronological',
											showQuotes: true,
											showReplies: 'follows',
											showReposts: true,
										}
							}
						/>
					);
				}}
			/>
		</div>
	);
};

export default HomeView;
