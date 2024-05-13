import { For, Suspense, SuspenseList, createMemo, createSignal } from 'solid-js';

import { useSuspend } from '@mary/solid-freeze';
import { createQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { formatQueryError } from '~/api/utils/misc';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { signal, type Signal } from '~/utils/signals';

import { preferences } from '~/desktop/globals/settings';

import CircularProgress from '~/com/components/CircularProgress';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import ProfileItem, { type ProfileItemAccessory } from '~/com/components/items/ProfileItem';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import VisibilityIcon from '~/com/icons/baseline-visibility';
import VisibilityOffIcon from '~/com/icons/baseline-visibility-off';
import { IconButton } from '~/com/primitives/icon-button';
import { loadMoreBtn } from '~/com/primitives/interactive';

import { useViewRouter } from '../_router';

const PAGE_LIMIT = 25;

interface ProfileHiddenItem {
	did: At.DID;
	hidden: Signal<boolean>;
}

const TemporaryMutesView = () => {
	const router = useViewRouter();

	const hiddenReposters = preferences.moderation.hideReposts;

	const [page, setPage] = createSignal(1);

	const profiles = createMemo<ProfileHiddenItem[]>((prev) => {
		// 1. create a set from the previous iteration
		const seen = new Map(prev.map((x) => [x.did, x.hidden]));

		// 2. go through the tempMutes object
		const next: ProfileHiddenItem[] = prev.slice();

		for (let i = 0, ilen = hiddenReposters.length; i < ilen; i++) {
			// users in this array will always be muted
			const did = hiddenReposters[i];
			const state = seen.get(did);

			if (state) {
				// user is already in array, make sure it's muted in UI
				state.value = true;
				seen.delete(did);
			} else {
				// user is not in array, add it
				next.unshift({ did: did, hidden: signal(true) });
			}
		}

		// 3. go through the array itself
		for (let i = 0, ilen = next.length; i < ilen; i++) {
			const item = next[i];
			const state = seen.get(item.did);

			if (state) {
				// it's still in the seen map, so it didn't get processed by above
				// let's make sure they're unmuted
				state.value = false;
			}
		}

		return next;
	}, []);

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={router.back}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Hidden reposters</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto">
				<SuspenseList revealOrder="forwards" tail="collapsed">
					<For each={profiles().slice(0, page() * PAGE_LIMIT)}>
						{({ did, hidden }) => {
							const profile = createQuery(() => {
								const key = getProfileKey(multiagent.active!, did);

								return {
									queryKey: key,
									queryFn: getProfile,
									initialDataUpdatedAt: 0,
									initialData: () => getInitialProfile(key),
									meta: {
										batched: true,
									},
								};
							});

							const suspend = useSuspend(() => profile.isFetching);

							const aside: ProfileItemAccessory = {
								render: () => {
									return (
										<button
											title={!hidden.value ? `Hide this user's reposts` : `Unhide this user's reposts`}
											onClick={() => {
												const next = !hidden.value;

												if (next) {
													hiddenReposters.push(did);
												} else {
													const index = hiddenReposters.indexOf(did);

													if (index !== -1) {
														hiddenReposters.splice(index, 1);
													}
												}
											}}
											class={
												'grid h-9 w-9 place-items-center rounded-full border border-input text-xl outline-2 outline-primary focus-visible:outline disabled:pointer-events-none' +
												(!hidden.value
													? ' hover:bg-secondary/40'
													: ' text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10')
											}
										>
											{(() => {
												const Icon = !hidden.value ? VisibilityIcon : VisibilityOffIcon;
												return <Icon />;
											})()}
										</button>
									);
								},
							};

							return (
								<Suspense
									fallback={
										<div class="grid h-13 place-items-center">
											<CircularProgress />
										</div>
									}
									children={(() => {
										suspend();

										const data = profile.data;
										if (data) {
											return (
												<VirtualContainer estimateHeight={112}>
													<ProfileItem profile={data} aside={aside} onClick={() => {}} />
												</VirtualContainer>
											);
										}

										const error = profile.error;
										if (error) {
											return (
												<div class="flex items-center gap-3 px-4 py-3 text-sm">
													<div class="h-12 w-12 shrink-0 rounded-full bg-muted-fg"></div>

													<div class="text-muted-fg">
														<p>Unable to retrieve this user</p>
														<p>{did}</p>
														<p>{/* @once */ formatQueryError(error)}</p>
													</div>
												</div>
											);
										}
									})()}
								/>
							);
						}}
					</For>

					<Suspense
						fallback={null}
						children={(() => {
							if (profiles().length > page() * PAGE_LIMIT) {
								return (
									<button onClick={() => setPage(page() + 1)} class={loadMoreBtn}>
										Show more profiles
									</button>
								);
							} else {
								return (
									<div class="grid h-13 shrink-0 place-items-center text-sm text-muted-fg">End of list</div>
								);
							}
						})()}
					/>
				</SuspenseList>
			</div>
		</div>
	);
};

export default TemporaryMutesView;
