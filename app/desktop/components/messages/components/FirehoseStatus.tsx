import { type JSX } from 'solid-js';

import { FirehoseStatus } from '~/desktop/lib/messages/firehose';

import { useChatPane } from '../contexts/chat';
import CellTowerIcon from '~/com/icons/baseline-cell-tower';

const FirehoseIndicator = () => {
	const { firehose } = useChatPane();

	return (() => {
		const status = firehose.status();

		if (status === FirehoseStatus.INITIALIZING) {
			return (
				<div class="flex items-center gap-3 bg-secondary/30 px-4 py-2.5">
					<div class="flex w-10 justify-center">
						<CellTowerIcon class="text-lg text-muted-fg" />
					</div>
					<p class="text-de font-medium">Connecting to gateway</p>
				</div>
			);
		} else if (status === FirehoseStatus.ERROR) {
			const error = firehose.error()!;
			const kind = error.kind;

			return (
				<div class="flex items-center gap-3 bg-muted px-4 py-2.5">
					<div class="flex w-10 justify-center">
						<CellTowerIcon class="text-lg text-muted-fg" />
					</div>
					<p class="grow text-de font-medium">
						{kind === 'init_failure' ? `Can't connect to gateway` : `We seem to have lost connection...`}
					</p>
					<button onClick={firehose.resume} class="text-de font-medium text-accent hover:underline">
						Retry
					</button>
				</div>
			);
		}
	}) as unknown as JSX.Element;
};

export default FirehoseIndicator;
