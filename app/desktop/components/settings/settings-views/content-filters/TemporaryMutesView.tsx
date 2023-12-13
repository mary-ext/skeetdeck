import { For, Suspense, SuspenseList, createMemo, createSignal } from 'solid-js';

import { useSuspend } from '@pkg/solid-freeze';
import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { formatAbsDateTime } from '~/utils/intl/time.ts';
import { type Signal, signal } from '~/utils/signals.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { preferences } from '~/desktop/globals/settings.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { loadMoreBtn } from '~/com/primitives/interactive.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { useSharedPreferences } from '~/com/components/SharedPreferences.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import MuteConfirmDialog from '~/com/components/dialogs/MuteConfirmDialog.tsx';
import ProfileItem, { type ProfileItemAccessory } from '~/com/components/items/ProfileItem.tsx';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import VolumeOffIcon from '~/com/icons/baseline-volume-off.tsx';
import VolumeUpIcon from '~/com/icons/baseline-volume-up.tsx';

import { VIEW_CONTENT_FILTERS, useViewRouter } from '../_router.tsx';

const PAGE_LIMIT = 25;

interface ProfileMuteItem {
	did: DID;
	muted: Signal<boolean>;
}

const TemporaryMutesView = () => {
	const router = useViewRouter();

	const tempMutes = preferences.filters.tempMutes;

	const [page, setPage] = createSignal(1);

	const profiles = createMemo<ProfileMuteItem[]>((prev) => {
		// 1. create a set from the previous iteration
		const seen = new Map(prev.map((x) => [x.did, x.muted]));

		// 2. go through the tempMutes object
		const now = Date.now();
		const next: ProfileMuteItem[] = prev.slice();

		for (const _did in tempMutes) {
			// assert _did as an actual DID because TypeScript converted to to string indices
			const did = _did as DID;
			const val = tempMutes[did];

			if (val != null && now < val) {
				// this user is actually muted

				const state = seen.get(did);
				if (state) {
					// user is already in array, make sure it's muted in the UI
					state.value = true;
				} else {
					// user is not in array, add it
					next.unshift({ did: did, muted: signal(true) });
				}
			} else {
				// user is no longer muted, but still in the object for reasons
				// @todo: should we clear it up here?

				const state = seen.get(did);
				if (state) {
					// user is in array, make sure it's unmuted in the UI
					state.value = false;
				}
			}

			// remove from map because we've already worked on them, we'll be reusing
			// this map for the loop below
			seen.delete(did);
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

		console.log({ prev, next });

		return next;
	}, []);

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={() => router.move({ type: VIEW_CONTENT_FILTERS })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Temporarily muted users</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto">
				<SuspenseList revealOrder="forwards" tail="collapsed">
					<For each={profiles().slice(0, page() * PAGE_LIMIT)}>
						{({ did, muted }) => {
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
								render: (profile) => {
									return (
										<button
											onClick={() => {
												openModal(() => (
													<MuteConfirmDialog
														profile={profile}
														filters={/* @once */ useSharedPreferences().filters}
														forceTempMute
													/>
												));
											}}
											class={
												'grid h-9 w-9 place-items-center rounded-full border border-input text-xl outline-2 outline-primary focus-visible:outline disabled:pointer-events-none' +
												(!muted.value
													? ' hover:bg-secondary/40'
													: ' text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/10')
											}
										>
											{(() => {
												const Icon = !muted.value ? VolumeUpIcon : VolumeOffIcon;
												return <Icon />;
											})()}
										</button>
									);
								},
							};

							const footer: ProfileItemAccessory = {
								render: () => {
									const date = tempMutes[did];

									if (date) {
										return (
											<p class="text-sm text-muted-fg">
												Muted until <span class="font-bold">{/* @once */ formatAbsDateTime(date)}</span>
											</p>
										);
									}
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
													<ProfileItem profile={data} aside={aside} footer={footer} onClick={() => {}} />
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
														<p>{/* @once */ '' + error}</p>
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
