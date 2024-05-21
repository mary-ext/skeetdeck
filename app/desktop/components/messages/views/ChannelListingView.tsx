import { createEffect, createMemo, onCleanup, onMount } from 'solid-js';

import { getAccountData } from '~/api/globals/agent';

import { createChannelListing, FetchState } from '~/desktop/lib/messages/channel-listing';

import List from '~/com/components/List';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import MailAddOutlinedIcon from '~/com/icons/outline-mail-add';
import { IconButton } from '~/com/primitives/icon-button';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import ChannelItem from '../components/ChannelItem';
import ChatAccountAction from '../components/ChatAccountAction';
import FirehoseIndicator from '../components/FirehoseStatus';

import { useChatPane } from '../contexts/chat';
import { ViewKind, type ViewParams } from '../contexts/router';
import { isChatDeletedAccount } from '../utils/chat';

import { useMessages } from '../MessagesContext';

const ChannelListingView = ({}: ViewParams<ViewKind.CHANNEL_LISTING>) => {
	const { setUnreadCount } = useMessages();
	const { close, did, rpc, firehose, router } = useChatPane();

	const profile = createMemo(() => getAccountData(did)?.profile);

	const listing = createChannelListing({ did, firehose, rpc });

	onMount(() => {
		listing.mount();
		onCleanup(listing.destroy);
	});

	createEffect(() => {
		const unreadChannels = listing.channels().filter((channel) => {
			return !channel.muted.value && channel.unread.value;
		});

		setUnreadCount(unreadChannels.length);
	});

	return (
		<>
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button title={`Close chat`} onClick={close} class={/* @once */ IconButton({ edge: 'left' })}>
					<ArrowLeftIcon />
				</button>

				<p class="grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">Chat</p>

				<div class="flex min-w-0 shrink-0 gap-1 empty:hidden">
					<button
						title="Start a new conversation"
						onClick={() => router.to({ kind: ViewKind.NEW_CHANNEL })}
						class={/* @once */ IconButton()}
					>
						<MailAddOutlinedIcon />
					</button>

					<ChatAccountAction>
						<button
							title="Manage accounts"
							class="class='h-8 -mr-1 grid w-8 place-items-center hover:opacity-80"
						>
							<img src={profile()?.avatar || DefaultUserAvatar} class="h-6 w-6 rounded-full" />
						</button>
					</ChatAccountAction>
				</div>
			</div>

			<FirehoseIndicator />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<List
					data={listing.channels()}
					// error={listing.error}
					render={(convo) => (
						<ChannelItem
							item={convo}
							onClick={() => {
								if (isChatDeletedAccount(convo)) {
									return;
								}

								router.to({ kind: ViewKind.CHANNEL, id: convo.id });
							}}
						/>
					)}
					hasNextPage={listing.cursor() != null}
					hasNewData={listing.hasNew()}
					isFetchingNextPage={(() => {
						const fetching = listing.fetching();
						return fetching === FetchState.DOWNWARDS || fetching === FetchState.INITIAL;
					})()}
					isRefreshing={listing.fetching() === FetchState.REFRESH}
					onEndReached={listing.doLoadDownwards}
					onRefresh={listing.doRefresh}
				/>
			</div>
		</>
	);
};

export default ChannelListingView;
