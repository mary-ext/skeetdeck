import { For, Suspense, SuspenseList, createMemo, createSignal } from 'solid-js';

import { useSuspend } from '@mary/solid-freeze';
import { createQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { formatQueryError } from '~/api/utils/misc';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { formatAbsDateTime } from '~/utils/intl/time';
import { type Signal, signal } from '~/utils/signals';

import { openModal } from '~/com/globals/modals';

import { preferences } from '~/desktop/globals/settings';

import { IconButton } from '~/com/primitives/icon-button';
import { loadMoreBtn } from '~/com/primitives/interactive';

import CircularProgress from '~/com/components/CircularProgress';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import SilenceConfirmDialog from '~/com/components/dialogs/SilenceConfirmDialog';
import ProfileItem, { type ProfileItemAccessory } from '~/com/components/items/ProfileItem';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import VolumeOffIcon from '~/com/icons/baseline-volume-off';
import VolumeUpIcon from '~/com/icons/baseline-volume-up';

import { VIEW_MODERATION, useViewRouter } from '../_router';

const PAGE_LIMIT = 25;

interface ProfileMuteItem {
	did: At.DID;
	muted: Signal<boolean>;
}

const TemporaryMutesView = () => {
	const router = useViewRouter();

	const tempMutes = preferences.moderation.tempMutes;

	const [page, setPage] = createSignal(1);

	const profiles = createMemo<ProfileMuteItem[]>((prev) => {
		// 1. create a set from the previous iteration
		const set = new Map(prev.map((x) => [x.did, x.muted]));

		// 2. go through the tempMutes object
		const next: ProfileMuteItem[] = prev.slice();

		for (const _did in tempMutes) {
			// TypeScript always asserts object keys as string, assert it as DID
			const did = _did as At.DID;
			const val = tempMutes[did];

			if (val) {
				// this user is muted

				const state = set.get(did);
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

				const state = set.get(did);
				if (state) {
					// user is in array, make sure it's unmuted in the UI
					state.value = false;
				}
			}

			// remove from map because we've already worked on them, we'll be reusing
			// this map for the loop below
			set.delete(did);
		}

		// 3. go through the array itself
		for (let i = 0, ilen = next.length; i < ilen; i++) {
			const item = next[i];
			const state = set.get(item.did);

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
					onClick={() => router.move({ type: VIEW_MODERATION })}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<h2 class="grow text-base font-bold">Silenced users</h2>
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
											title={!muted.value ? `Silence this user` : `Unsilence this user`}
											onClick={() => {
												openModal(() => <SilenceConfirmDialog profile={profile} />);
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
												Silenced until <span class="font-bold">{/* @once */ formatAbsDateTime(date)}</span>
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
