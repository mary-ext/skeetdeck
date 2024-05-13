import { Show, createMemo } from 'solid-js';

import { createMutation, createQuery } from '@mary/solid-query';

import { multiagent } from '~/api/globals/agent';

import { upsertProfile } from '~/api/mutations/upsert-profile';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { clsx } from '~/utils/misc';

import Checkbox from '~/com/components/inputs/Checkbox';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import BlockIcon from '~/com/icons/baseline-block';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';
import PeopleOutlinedIcon from '~/com/icons/outline-people';
import VolumeOffOutlinedIcon from '~/com/icons/outline-volume-off';
import { IconButton } from '~/com/primitives/icon-button';
import {
	ListBox,
	ListBoxBlock,
	ListBoxItemChevron,
	ListBoxItemIcon,
	ListBoxItemInteractive,
	ListGroup,
	ListGroupHeader,
} from '~/com/primitives/list-box';

import { VIEW_ACCOUNT_CONFIG, useViewRouter, type ViewParams } from '../_router';

const NO_UNAUTHENTICATED_LABEL = '!no-unauthenticated';

const AccountModerationView = () => {
	const router = useViewRouter();
	const { did } = router.current as ViewParams<typeof VIEW_ACCOUNT_CONFIG>;

	const account = createMemo(() => multiagent.accounts.find((account) => account.did === did));

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

				<Show when={account()} keyed>
					{(account) => {
						return (
							<div class="flex min-w-0 grow flex-col gap-0.5">
								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
									Account settings
								</p>

								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
									{'@' + account.session.handle}
								</p>
							</div>
						);
					}}
				</Show>
			</div>
			<Show when={account()} keyed>
				{(_account) => {
					const profile = createQuery(() => {
						const key = getProfileKey(did, did);

						return {
							queryKey: key,
							queryFn: getProfile,
							staleTime: 10_000,
							initialDataUpdatedAt: 0,
							initialData: () => getInitialProfile(key),
						};
					});

					const mutation = createMutation(() => {
						return {
							mutationFn: async ({ next }: { next: boolean }) => {
								return upsertProfile(did, (record) => {
									const labels =
										record?.labels?.values.filter((l) => l.val !== NO_UNAUTHENTICATED_LABEL) || [];

									if (next) {
										labels.push({ val: NO_UNAUTHENTICATED_LABEL });
									}

									return {
										...record,
										labels:
											labels.length !== 0
												? { $type: 'com.atproto.label.defs#selfLabels', values: labels }
												: undefined,
									};
								});
							},
							onSuccess: async () => {
								await new Promise((resolve) => setTimeout(resolve, 3_000));
								profile.refetch();
							},
						};
					});

					const isLimitedVisibility = () => {
						return !!profile.data?.labels.value.some((label) => label.val === NO_UNAUTHENTICATED_LABEL);
					};

					const isLoading = () => {
						return mutation.isPending || profile.isFetching || profile.isError;
					};

					return (
						<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
							<div class={ListGroup}>
								<p class={ListGroupHeader}>Moderation tools</p>

								<fieldset disabled class={ListBox}>
									<button class={ListBoxItemInteractive}>
										<PeopleOutlinedIcon class={ListBoxItemIcon} />
										<span class="grow font-medium">Moderation lists</span>
										<ChevronRightIcon class={ListBoxItemChevron} />
									</button>

									<button class={ListBoxItemInteractive}>
										<VolumeOffOutlinedIcon class={ListBoxItemIcon} />
										<span class="grow font-medium">Muted accounts</span>
										<ChevronRightIcon class={ListBoxItemChevron} />
									</button>

									<button class={ListBoxItemInteractive}>
										<BlockIcon class={ListBoxItemIcon} />
										<span class="grow font-medium">Blocked accounts</span>
										<ChevronRightIcon class={ListBoxItemChevron} />
									</button>
								</fieldset>
							</div>

							<div class={ListGroup}>
								<p class={ListGroupHeader}>Logged-out visibility</p>

								<div class={ListBox}>
									<div class={ListBoxBlock}>
										<label class="flex min-w-0 items-center justify-between gap-4">
											<span class={clsx(['font-medium', isLoading() && `opacity-50`])}>
												Request limited visibility of my account
											</span>

											<Checkbox
												disabled={isLoading()}
												checked={isLimitedVisibility()}
												onInput={(ev) => {
													mutation.mutate({ next: ev.target.checked });
													ev.target.checked = !ev.target.checked;
												}}
											/>
										</label>

										<p class="mt-3 text-de text-muted-fg">
											This option tells every app, including Bluesky app, that you don't want your account to
											be seen by users who aren't currently signed in to an account.
										</p>

										<p class="mt-1 text-de font-bold text-muted-fg">
											Honoring this request is voluntary — your profile and posts will remain publicly
											available, and some apps may show your account regardless.
										</p>
									</div>
								</div>
							</div>
						</div>
					);
				}}
			</Show>
		</div>
	);
};

export default AccountModerationView;
