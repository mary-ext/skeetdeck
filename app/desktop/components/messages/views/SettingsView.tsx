import { createMutation, createQuery } from '@mary/solid-query';

import type { ChatBskyActorDeclaration } from '~/api/atp-schema';
import { getAccountHandle } from '~/api/globals/agent';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import { IconButton } from '~/com/primitives/icon-button';
import { ListBox, ListGroup, ListGroupHeader } from '~/com/primitives/list-box';

// @todo: move these components outside of settings
import { SelectionItem } from '../../settings/settings-views/_components';

import { useChatPane } from '../contexts/chat';
import type { ViewKind, ViewParams } from '../contexts/router';

type DeclarationRecord = ChatBskyActorDeclaration.Record;
type AllowValue = DeclarationRecord['allowIncoming'];

const SettingsView = ({}: ViewParams<ViewKind.SETTINGS>) => {
	const { did, router, rpc } = useChatPane();

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
			async mutationFn({ allow }: { allow: AllowValue }) {
				const record: DeclarationRecord = {
					allowIncoming: allow,
				};

				await rpc.call('com.atproto.repo.putRecord', {
					data: {
						repo: did,
						collection: 'chat.bsky.actor.declaration',
						rkey: 'self',
						record: record,
					},
				});
			},
			async onSettled() {
				await new Promise((resolve) => setTimeout(resolve, 3_000));
				profile.refetch();
			},
		};
	});

	return (
		<>
			<div class="flex h-13 shrink-0 items-center gap-3 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={router.back}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<div class="flex min-w-0 grow flex-col gap-0.5">
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
						Chat settings
					</p>

					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg empty:hidden">
						{'@' + getAccountHandle(did)}
					</p>
				</div>
			</div>

			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<p class={ListGroupHeader}>Privacy</p>

					<div class={ListBox}>
						<SelectionItem<AllowValue>
							title="Allow messages from"
							description="This will not affect existing conversations"
							value={profile.data?.associated.value.chat.allowIncoming}
							disabled={profile.isLoading || profile.isRefetching || mutation.isPending}
							onChange={(next) => mutation.mutate({ allow: next })}
							options={[
								{
									value: 'none',
									label: `Nobody`,
								},
								{
									value: 'following',
									label: `People I follow`,
								},
								{
									value: 'all',
									label: `Everyone`,
								},
							]}
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export default SettingsView;
