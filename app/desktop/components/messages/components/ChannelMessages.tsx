import { createEffect, For, Match, onCleanup, onMount, Switch } from 'solid-js';

import type { SignalizedConvo } from '~/api/stores/convo';

import { scrollObserver } from '~/utils/intersection-observer';

import { EntryType } from '~/desktop/lib/messages/channel';

import CircularProgress from '~/com/components/CircularProgress';

import { useChatPane } from '../contexts/chat';

import MessageDivider from './MessageDivider';
import MessageItem from './MessageItem';

interface ChannelMessagesProps {
	/** Expected to be static */
	convo: SignalizedConvo;
	/** Maximum amount of messages to fetch at a time */
	fetchLimit: number;
}

const ChannelMessages = (props: ChannelMessagesProps) => {
	let ref: HTMLElement;

	const convo = props.convo;

	const { firehose, channels } = useChatPane();
	const channel = channels.get(convo.id);

	let atBottom = true;

	const onScroll = () => {
		atBottom = ref!.scrollTop >= ref!.scrollHeight - ref!.offsetHeight - 100;
	};

	onMount(() => {
		channel.mount();
		onCleanup(firehose.requestPollInterval(3_000));
	});

	createEffect((o: { latest?: string; oldest?: string; height?: number } = {}) => {
		const latest = channel.messages().at(-1)?.id;
		const oldest = channel.messages().at(0)?.id;

		if (latest !== o.latest) {
			if (atBottom) {
				ref!.scrollTo(0, ref!.scrollHeight);
			}

			o.latest = latest;
		}

		if (oldest !== o.oldest) {
			if (o.oldest !== undefined && ref!.scrollTop <= 100) {
				const delta = ref!.scrollHeight - o.height! + ref!.scrollTop;
				ref!.scrollTo(0, delta);
			}

			o.oldest = oldest;
		}

		o.height = ref!.scrollHeight;
		return o;
	});

	return (
		<div ref={(node) => (ref = node)} onScroll={onScroll} class="flex min-h-0 grow flex-col overflow-y-auto">
			<Switch>
				<Match when={channel.oldestRev() === null}>
					<div class="px-3 py-6">
						<p class="text-sm text-muted-fg">This is the start of your message history.</p>
					</div>
				</Match>

				<Match when={channel.fetching() != null || channel.oldestRev() != null}>
					<div
						ref={(node) => {
							createEffect(() => {
								if (channel.oldestRev() != null && channel.fetching() == null) {
									// @ts-expect-error
									if (node.$onintersect === undefined) {
										// @ts-expect-error
										node.$onintersect = (entry: IntersectionObserverEntry) => {
											if (entry.isIntersecting) {
												channel.doLoadUpwards();
											}
										};

										scrollObserver.observe(node);
									}
								} else {
									// @ts-expect-error
									if (node.$onintersect !== undefined) {
										// @ts-expect-error
										node.$onintersect = undefined;

										scrollObserver.unobserve(node);
									}
								}
							});
						}}
						class="grid h-13 shrink-0 place-items-center"
					>
						<CircularProgress />
					</div>
				</Match>
			</Switch>
			<For each={channel.entries()}>
				{(entry) => {
					const type = entry.type;

					if (type === EntryType.MESSAGE) {
						return (
							<MessageItem convo={convo} item={/* @once */ entry.message} tail={/* @once */ entry.tail} />
						);
					}

					if (type === EntryType.DIVIDER) {
						return <MessageDivider date={/* @once */ entry.date} />;
					}

					return null;
				}}
			</For>
		</div>
	);
};

export default ChannelMessages;
