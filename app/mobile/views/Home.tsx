import { For, batch, createEffect, createMemo, createSignal } from 'solid-js';

import type { AtUri } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';

import { preferences } from '../globals/settings.ts';

import { useEntryState } from '../utils/router.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import Tab from '~/com/components/Tab.tsx';

import ViewHeader from '../components/ViewHeader.tsx';

import ValidatedKeepAlive from '../components/ValidatedKeepAlive.tsx';

const HomeView = () => {
	const [state, setState] = useEntryState<{ uri?: AtUri }>();
	const [uri, setUri] = createSignal(state().uri);

	const setTab = (next: AtUri | undefined) => {
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
			<ViewHeader title="Home" fixed={hasPinnedFeeds()} borderless={hasPinnedFeeds()} />

			{hasPinnedFeeds() && (
				<div class="sticky top-0 z-30 flex h-13 shrink-0 overflow-x-auto border-b border-divider bg-background">
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
