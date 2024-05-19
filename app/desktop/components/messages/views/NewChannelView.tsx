import { createMemo, createSignal } from 'solid-js';

import { createInfiniteQuery, createMutation, createQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import {
	getInitialProfileFollows,
	getProfileFollows,
	getProfileFollowsKey,
} from '~/api/queries/get-profile-follows';
import { searchProfilesTypeahead, searchProfilesTypeaheadKey } from '~/api/queries/search-profiles-typeahead';
import { mergeConvo } from '~/api/stores/convo';

import { getModerationOptions } from '~/com/globals/shared';

import { createDebouncedValue } from '~/utils/hooks';
import { autofocusIf, model, refs } from '~/utils/input';

import List from '~/com/components/List';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import SearchInput from '~/com/components/inputs/SearchInput';
import ProfileItem from '~/com/components/items/ProfileItem';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import { IconButton } from '~/com/primitives/icon-button';

import CircularProgress from '~/com/components/CircularProgress';
import { useChatPane } from '../contexts/chat';
import { ViewKind, type ViewParams } from '../contexts/router';

const NewChannelView = ({}: ViewParams<ViewKind.NEW_CHANNEL>) => {
	const { did, rpc, router, isOpen } = useChatPane();

	const [search, setSearch] = createSignal('');
	const debouncedSearch = createDebouncedValue(() => search().trim(), 500);

	const follows = createInfiniteQuery(() => {
		const key = getProfileFollowsKey(did, did);

		return {
			enabled: debouncedSearch() === '',
			queryKey: key,
			queryFn: getProfileFollows,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData: () => getInitialProfileFollows(key),
			meta: {
				moderation: getModerationOptions(),
			},
			select: (data) => data.pages[0].profiles,
		};
	});

	const typeahead = createQuery(() => {
		return {
			enabled: debouncedSearch() !== '',
			queryKey: searchProfilesTypeaheadKey(did, debouncedSearch(), 5),
			queryFn: searchProfilesTypeahead,
			meta: {
				moderation: getModerationOptions(),
			},
		};
	});

	const query = createMemo(() => {
		return debouncedSearch() === '' ? follows : typeahead;
	});

	const mutation = createMutation(() => {
		return {
			async mutationFn({ actor }: { actor: At.DID }) {
				const { data } = await rpc.get('chat.bsky.convo.getConvoForMembers', {
					params: {
						members: [actor],
					},
				});

				const convo = mergeConvo(did, data.convo);

				return convo;
			},
			onSuccess(data) {
				router.replace({ kind: ViewKind.CHANNEL, id: data.id });
			},
		};
	});

	return (
		<>
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={router.back}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<p class="grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
					Start a new conversation
				</p>

				{(() => {
					if (mutation.isPending) {
						return <CircularProgress />;
					}
				})()}
			</div>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<div class="shrink-0 p-4">
					<SearchInput
						ref={refs(model(search, setSearch), autofocusIf(isOpen))}
						disabled={mutation.isPending}
					/>
				</div>

				<List
					data={query().data}
					error={query().error}
					render={(profile) => {
						const canMessage = createMemo(() => {
							const allowed = profile.associated.value.chat.allowIncoming;

							if (allowed === 'all') {
								return true;
							} else if (allowed === 'following') {
								return !!profile.viewer.followedBy.value;
							}

							return false;
						});

						return (
							<VirtualContainer class="shrink-0" estimateHeight={64}>
								<ProfileItem
									profile={profile}
									disabled={!canMessage() || mutation.isPending}
									onClick={() => mutation.mutate({ actor: profile.did })}
									small
									footer={{
										render: () => {
											if (!canMessage()) {
												return <p class="text-sm">You can't message this user</p>;
											}
										},
									}}
								/>
							</VirtualContainer>
						);
					}}
					isFetchingNextPage={query().isFetching}
				/>
			</div>
		</>
	);
};

export default NewChannelView;
