import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	onCleanup,
	onMount,
	type Resource,
} from 'solid-js';

import type { ChatBskyConvoGetLog } from '~/api/atp-schema';
import { getAccountData } from '~/api/globals/agent';
import { mergeConvo, type SignalizedConvo } from '~/api/stores/convo';

import { assert } from '~/utils/misc';

import List from '~/com/components/List';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import { IconButton } from '~/com/primitives/icon-button';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import ChannelItem from '../components/ChannelItem';

import { useChatPane } from '../contexts/chat';
import { ViewKind, type ViewParams } from '../contexts/router';

type ChannelEvents = ChatBskyConvoGetLog.Output['logs'];

interface ChannelListingReturn {
	cursor: string | undefined;
	convos: SignalizedConvo[];
}

const ChannelListingView = ({}: ViewParams<ViewKind.CHANNEL_LISTING>) => {
	const { close, did, rpc, firehose, router } = useChatPane();

	const profile = createMemo(() => getAccountData(did)?.profile);

	const [hasNew, setHasNew] = createSignal(false);
	const [listing, { refetch, mutate }] = createResource<ChannelListingReturn, string | undefined>(
		async (_key, { refetching, value }) => {
			const hasCursor = typeof refetching === 'string';

			const limit = 20;
			const { data } = await rpc.get('chat.bsky.convo.listConvos', {
				params: {
					cursor: hasCursor ? refetching : undefined,
					limit: limit,
				},
			});

			const convos = data.convos.map((convo) => mergeConvo(did, convo));
			const nextCursor = convos.length >= limit ? data.cursor : undefined;

			if (hasCursor && value) {
				return {
					cursor: nextCursor,
					convos: value.convos.concat(convos),
				};
			}

			setHasNew(false);

			return {
				cursor: nextCursor,
				convos: convos,
			};
		},
	);

	{
		let pendingEvents: Map<string, ChannelEvents> | undefined;

		const updateListing = (data: ChannelListingReturn, map: Map<string, ChannelEvents>) => {
			let spliced = false;
			let convos = data.convos;

			for (const [convoId, events] of map) {
				// @todo: actually go through all events.
				const latest = events.at(-1)!;
				if (!latest) {
					continue;
				}

				let itemIndex = convos.findIndex((c) => c.id === convoId);
				const item = itemIndex !== -1 && convos[itemIndex];

				const type = latest.$type;

				if (item) {
					if (latest.rev > item.rev) {
						if (
							type === 'chat.bsky.convo.defs#logCreateMessage' ||
							type === 'chat.bsky.convo.defs#logDeleteMessage'
						) {
							item.rev = latest.rev;
							item.lastMessage.value = latest.message;
							item.unread.value = true;

							if (itemIndex !== 0) {
								spliced = true;
								convos = [item, ...convos.toSpliced(itemIndex, 1)];
								itemIndex = 0;
							}
						} else if (type === 'chat.bsky.convo.defs#logLeaveConvo') {
							// @todo: we still have to handle join convos obviously
							convos = convos.toSpliced(itemIndex, 1);
						}
					}
				} else {
					setHasNew(true);
				}
			}

			if (spliced) {
				return { cursor: data.cursor, convos };
			}

			return data;
		};

		createEffect(() => {
			if (listing.state !== 'ready') {
				// Listing hasn't loaded yet, so we'll dump the events somewhere.
				if (!pendingEvents) {
					pendingEvents = new Map();
				}
			} else if (pendingEvents) {
				// Listing has loaded, so let's process these events, if there are any.
				const map = pendingEvents;
				pendingEvents = undefined;

				if (map.size > 0) {
					mutate((data) => {
						assert(data !== undefined, `expected data to exist`);
						return updateListing(data, map);
					});
				}
			}
		});

		onMount(() => {
			onCleanup(
				firehose.emitter.on('log', (buckets) => {
					if (pendingEvents) {
						for (const [channelId, events] of buckets) {
							// @todo: I think we only need the latest events for now...
							pendingEvents.set(channelId, events);
						}

						return;
					}

					mutate((data) => {
						assert(data !== undefined, `expected data to exist`);
						return updateListing(data, buckets);
					});
				}),
			);
		});
	}

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
					data={isResourceReady(listing) ? listing.latest.convos : undefined}
					error={listing.error}
					render={(convo) => (
						<ChannelItem
							uid={did}
							item={convo}
							onClick={() => router.to({ kind: ViewKind.CHANNEL, id: convo.id })}
						/>
					)}
					hasNextPage={isResourceReady(listing) && listing.latest.cursor !== undefined}
					hasNewData={hasNew()}
					isFetchingNextPage={listing.loading}
					onEndReached={() => {
						const cursor = isResourceReady(listing) && listing.latest.cursor;
						if (cursor) {
							refetch(cursor);
						}
					}}
				/>
			</div>
		</>
	);
};

export default ChannelListingView;

type ReadyResource<T, R = Resource<T>> = R extends { state: 'ready' | 'refreshing' } ? R : never;

function isResourceReady<T>(res: Resource<T>): res is ReadyResource<T> {
	const state = res.state;
	return state === 'ready' || state === 'refreshing';
}
