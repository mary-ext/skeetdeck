import { createMemo, onCleanup, onMount } from 'solid-js';

import { getAccountData } from '~/api/globals/agent';

import List from '~/com/components/List';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import { IconButton } from '~/com/primitives/icon-button';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { createChannelListing } from '~/desktop/lib/messages/channel-listing';

import ChannelItem from '../components/ChannelItem';

import { useChatPane } from '../contexts/chat';
import { ViewKind, type ViewParams } from '../contexts/router';

const ChannelListingView = ({}: ViewParams<ViewKind.CHANNEL_LISTING>) => {
	const { close, did, rpc, firehose, router } = useChatPane();

	const profile = createMemo(() => getAccountData(did)?.profile);

	const listing = createChannelListing({ did, firehose, rpc });

	onMount(() => {
		listing.mount();
		onCleanup(listing.destroy);
	});

	return (
		<>
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title={`Close direct messages`}
					onClick={close}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<p class="grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
					Direct Messages
				</p>

				<div class="flex min-w-0 shrink-0 gap-1 empty:hidden">
					<button title="Manage accounts" class="hover:opacity-80">
						<img src={profile()?.avatar || DefaultUserAvatar} class="h-6 w-6 rounded-full" />
					</button>
				</div>
			</div>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<List
					data={listing.channels()}
					// error={listing.error}
					render={(convo) => (
						<ChannelItem
							uid={did}
							item={convo}
							onClick={() => router.to({ kind: ViewKind.CHANNEL, id: convo.id })}
						/>
					)}
					hasNextPage={listing.cursor() != null}
					hasNewData={listing.hasNew()}
					isFetchingNextPage={listing.fetching() !== undefined}
					onEndReached={listing.doLoadDownwards}
				/>
			</div>
		</>
	);
};

export default ChannelListingView;
