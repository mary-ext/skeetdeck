import type { BskyXRPC } from '@mary/bluesky-client';

import type { At, ChatBskyConvoDefs, ChatBskyConvoGetLog } from '~/api/atp-schema';

import type { ChatFirehose } from './firehose';

type ChannelEvents = ChatBskyConvoGetLog.Output['logs'];

export interface ChannelSnapshot {}

export interface ChannelOptions {
	id: string;
	rpc: BskyXRPC;
	bus: ChatFirehose;
	sender: At.DID;
}

export class Channel {
	#convoId: string;

	#rpc: BskyXRPC;
	#bus: ChatFirehose;
	#sender: At.DID;

	#status: ChannelStatus = ChannelStatus.UNINITIALIZED;

	/** Messages that we sent that have yet to make it to the logs */
	#sentMessages: unknown[] = [];
	/** The message history */
	#messages: ChatBskyConvoDefs.MessageView[] = [];

	/** Oldest message we've stored, `null` if we're at the start */
	#oldestRev: string | null | undefined;
	/** Newest message we've stored */
	#latestRev: string | undefined;

	/** Whether we're currently scrolled to the bottom or not */
	#isAtBottom = true;

	/** Snapshot of the current conversation state */
	#snapshot: ChannelSnapshot | undefined;
	/** Listeners tuning into this conversation */
	#listeners: ((next: ChannelSnapshot) => void)[] = [];

	#firehoseFailed = false;
	#fetchingHistory = false;

	constructor({ id, rpc, bus, sender }: ChannelOptions) {
		this.#convoId = id;
		this.#rpc = rpc;
		this.#bus = bus;
		this.#sender = sender;
	}

	/// Public API
	listen(listener: (next: ChannelSnapshot) => void): () => void {
		const listeners = this.#listeners;

		listener(this.#getSnapshot(false));

		if (listeners.length === 0) {
			this.init();
		}

		listeners.push(listener);

		return () => {
			const index = listeners.indexOf(listener);
			listeners.splice(index, 1);

			if (listeners.length === 0) {
				this.suspend();
			}
		};
	}

	init() {
		this.#bus.resume();
		this.#dispatch({ type: ChannelAction.INITIALIZE });
	}
	suspend() {
		this.#dispatch({ type: ChannelAction.SUSPEND });
	}

	async fetchOlderMessages(): Promise<void> {
		// Don't try to fetch older messages if we're:
		// - Currently not ready
		// - We're at the start of the conversation
		// - We're currently in the middle of doing one
		if (this.#status !== ChannelStatus.READY || this.#oldestRev === null || this.#fetchingHistory) {
			return;
		}
	}

	/// Dispatcher
	#dispatch(action: ChannelDispatch) {
		switch (this.#status) {
			case ChannelStatus.UNINITIALIZED: {
				break;
			}
			case ChannelStatus.INITIALIZING: {
				break;
			}
			case ChannelStatus.READY: {
				break;
			}
			case ChannelStatus.ERROR: {
				break;
			}
		}
	}

	/// State management
	#commit() {
		const listeners = this.#listeners;
		const snapshot = this.#getSnapshot(true);

		for (let idx = 0, len = listeners.length; idx < len; idx++) {
			(0, listeners[idx])(snapshot);
		}
	}

	#getSnapshot(override: boolean): ChannelSnapshot {
		if (override) {
			return (this.#snapshot = this.#generateSnapshot());
		} else {
			return (this.#snapshot ||= this.#generateSnapshot());
		}
	}

	#generateSnapshot(): ChannelSnapshot {
		throw new Error(`Unknown state`);
	}

	/// Firehose
	#cleanupFirehoseConnection: (() => void) | undefined;
	#setupFirehoseConnection() {
		this.#cleanupFirehoseConnection?.();

		this.#cleanupFirehoseConnection = bind([
			this.#bus.on('connect', () => {
				if (this.#firehoseFailed) {
					this.#firehoseFailed = false;
					this.#commit();
				}
			}),

			this.#bus.on('error', (error) => {
				this.#firehoseFailed = true;
				this.#commit();
			}),

			this.#bus.on(`log:${this.#convoId}`, (events) => {
				let messages = this.#messages;

				for (let i = 0, il = events.length; i < il; i++) {
					const event = events[i];
					const type = event.$type;

					if (type === 'chat.bsky.convo.defs#logCreateMessage') {
						const message = event.message;

						if (message.$type === 'chat.bsky.convo.defs#messageView') {
							messages = messages.concat(message);
						}
					} else if (type === 'chat.bsky.convo.defs#logDeleteMessage') {
						// This is going to be rare, since message deletions currently
						// doesn't reflect to the recipient, so we don't mind.
						const message = event.message;
						const id = message.id;

						for (let j = 0, jl = messages.length; j < jl; j++) {
							const x = messages[j];

							if (x.id === id) {
								messages = messages.toSpliced(j, 1);
								break;
							}
						}
					}
				}

				// If we're at the bottom and we have over 100 messages, trim it to 50.
				if (this.#isAtBottom && messages.length > 100) {
					messages = messages.slice(-50);
				}

				if (this.#messages !== messages) {
					this.#messages = messages;
					this.#commit();
				}
			}),
		]);
	}
}

const enum ChannelStatus {
	UNINITIALIZED,
	INITIALIZING,
	READY,
	ERROR,
}

const enum ChannelAction {
	INITIALIZE,
	SUSPEND,
	BACKGROUND,
	RESUME,
}

type ChannelDispatch =
	| { type: ChannelAction.INITIALIZE }
	| { type: ChannelAction.SUSPEND }
	| { type: ChannelAction.BACKGROUND }
	| { type: ChannelAction.RESUME };

function bind(fns: (() => void)[]): () => void {
	return () => fns.forEach((fn) => fn());
}
