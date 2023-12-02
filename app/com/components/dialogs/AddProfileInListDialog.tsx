import { For, createEffect } from 'solid-js';
import { unwrap } from 'solid-js/store';

import { createInfiniteQuery, createMutation, createQuery, useQueryClient } from '@pkg/solid-query';

import type { Records } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { ListPurposeLabels } from '~/api/display.ts';
import { getCurrentDate, getRecordId } from '~/api/utils/misc.ts';

import {
	getProfileInListKey,
	getProfileInList,
	type ProfileExistsResult,
} from '~/api/queries/get-profile-in-list.ts';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';
import { getProfileKey } from '~/api/queries/get-profile.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { createDerivedSignal } from '~/utils/hooks.ts';

import { closeModal, useModalState } from '../../globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog.ts';
import { IconButton } from '../../primitives/icon-button.ts';
import { Interactive, loadMoreBtn } from '~/com/primitives/interactive.ts';

import GenericErrorView from '../views/GenericErrorView.tsx';
import CircularProgress from '../CircularProgress.tsx';
import DialogOverlay from './DialogOverlay.tsx';

import CloseIcon from '../../icons/baseline-close.tsx';
import CheckIcon from '../../icons/baseline-check.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

export interface AddProfileInListDialogProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const listItem = Interactive({
	variant: 'muted',
	class: `flex min-w-0 items-center gap-3 px-4 py-3 text-left disabled:opacity-50`,
});

const AddProfileInListDialog = (props: AddProfileInListDialogProps) => {
	let listEl: HTMLDivElement | undefined;

	const queryClient = useQueryClient();
	const { close, disableBackdropClose } = useModalState();

	const profile = props.profile;
	const uid = profile.uid;

	const lists = createInfiniteQuery(() => {
		return {
			queryKey: getProfileListsKey(uid, uid),
			queryFn: getProfileLists,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const listMutation = createMutation(() => ({
		mutationFn: async () => {
			const btns = Array.from(listEl!.querySelectorAll<HTMLButtonElement>(':scope > button'));

			const did = profile.did;
			const date = getCurrentDate();

			const agent = await multiagent.connect(uid);

			const promises = btns.map(async (btn) => {
				const result = (btn as any).$data as ProfileExistsResult;

				if (!result) {
					return;
				}

				const listUri = result.list;
				const itemUri = result.exists.peek();

				const bool = btn.getAttribute('aria-pressed')! === 'true';

				if (bool === !!itemUri) {
					return;
				}

				if (itemUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							collection: 'app.bsky.graph.listitem',
							repo: uid,
							rkey: getRecordId(itemUri),
						},
					});

					result.exists.value = undefined;
				} else {
					const record: Records['app.bsky.graph.listitem'] = {
						list: listUri,
						subject: did,
						createdAt: date,
					};

					const response = await agent.rpc.call('com.atproto.repo.createRecord', {
						data: {
							collection: 'app.bsky.graph.listitem',
							repo: uid,
							record: record,
						},
					});

					result.exists.value = response.data.uri;
				}
			});

			await Promise.allSettled(promises);

			// we need to wait for the AppView to settle in, so let's add a delay here
			// ref: https://github.com/bluesky-social/social-app/blob/bb22ebd58866f4b14f8fa07a27b0ccdc9d06595a/src/state/queries/list-memberships.ts#L138
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: getProfileKey(uid, did) });
				queryClient.invalidateQueries({ queryKey: getProfileKey(uid, profile.handle.peek()) });
			}, 1_000);
		},
		onSuccess: () => {
			close();
		},
	}));

	createEffect(() => {
		disableBackdropClose.value = listMutation.isPending;
	});

	if (import.meta.env.VITE_APP_MODE === 'desktop') {
		return (
			<DialogOverlay>
				<div class={/* @once */ DialogRoot({ size: 'md', fullHeight: true })}>
					<fieldset disabled={listMutation.isPending} class="contents">
						<div class={/* @once */ DialogHeader({ divider: true })}>
							<button
								title="Close dialog"
								onClick={closeModal}
								class={/* @once */ IconButton({ edge: 'left' })}
							>
								<CloseIcon />
							</button>

							<h1 class={/* @once */ DialogTitle()}>Add to list</h1>

							<button
								onClick={() => {
									listMutation.mutate();
								}}
								class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
							>
								Save
							</button>
						</div>

						<div class={/* @once */ DialogBody({ padded: false, class: 'flex flex-col' })}>
							<div ref={listEl} class="contents">
								<For each={lists.data?.pages.flatMap((page) => page.lists)}>
									{(list) => {
										const result = createQuery(() => {
											return {
												queryKey: getProfileInListKey(uid, profile.did, list.uri),
												queryFn: getProfileInList,
											};
										});

										const [checked, setChecked] = createDerivedSignal(() => !!result.data?.exists.value);

										const purpose = () => {
											const raw = list.purpose.value;
											return raw in ListPurposeLabels ? ListPurposeLabels[raw] : `Unknown list`;
										};

										return (
											<button
												disabled={!result.data}
												aria-pressed={checked()}
												onClick={() => setChecked(!checked())}
												// @ts-expect-error
												prop:$data={unwrap(result.data)}
												class={listItem}
											>
												<img
													src={list.avatar.value || DefaultListAvatar}
													class="h-9 w-9 shrink-0 rounded-md"
												/>

												<div class="min-w-0 grow">
													<p class="break-words text-sm font-bold">{list.name.value}</p>
													<p class="text-sm text-muted-fg">{purpose()}</p>
												</div>

												<CheckIcon class="text-xl text-accent" classList={{ [`invisible`]: !checked() }} />
											</button>
										);
									}}
								</For>
							</div>

							{(() => {
								if (lists.isFetching) {
									return (
										<div class="grid h-13 place-items-center">
											<CircularProgress />
										</div>
									);
								}

								if (lists.isError) {
									return (
										<GenericErrorView
											error={lists.error}
											onRetry={() => {
												if (lists.isRefetchError || lists.isLoadingError) {
													lists.refetch();
												} else {
													// @ts-expect-error
													lists.fetchNextPage();
												}
											}}
										/>
									);
								}

								if (lists.hasNextPage) {
									return (
										<button onClick={() => lists.fetchNextPage()} class={loadMoreBtn}>
											Show more lists
										</button>
									);
								}

								return (
									<div class="grid h-13 shrink-0 place-items-center">
										<p class="text-sm text-muted-fg">End of list</p>
									</div>
								);
							})()}
						</div>
					</fieldset>
				</div>
			</DialogOverlay>
		);
	}

	return null;
};

export default AddProfileInListDialog;
