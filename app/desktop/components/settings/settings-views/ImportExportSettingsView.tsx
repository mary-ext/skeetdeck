import { preferences } from '~/desktop/globals/settings';

import { toBackup } from '~/desktop/lib/settings/backup';

import {
	ListBox,
	ListBoxItemChevron,
	ListBoxItemIcon,
	ListBoxItemInteractive,
	ListGroup,
} from '~/com/primitives/list-box';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right';
import AddIcon from '~/com/icons/baseline-download';
import UploadIcon from '~/com/icons/baseline-upload';

import { VIEW_IMPORT_SETTINGS, useViewRouter } from './_router';

const ImportExportSettingsView = () => {
	const router = useViewRouter();

	const handleExportClick = () => {
		const backup = toBackup(preferences);

		const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
		const blobUrl = URL.createObjectURL(blob);

		try {
			const anchor = document.createElement('a');
			anchor.download = `skeetdeck-settings-${new Date().toISOString()}.json`;
			anchor.href = blobUrl;

			anchor.click();
		} finally {
			URL.revokeObjectURL(blobUrl);
		}
	};

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Import/export settings</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<div class={ListBox}>
						<button class={ListBoxItemInteractive} onClick={handleExportClick}>
							<AddIcon class={ListBoxItemIcon} />
							<span class="grow font-medium">Export settings</span>
						</button>

						<button onClick={() => router.to({ type: VIEW_IMPORT_SETTINGS })} class={ListBoxItemInteractive}>
							<UploadIcon class={ListBoxItemIcon} />
							<span class="grow font-medium">Import settings</span>
							<ChevronRightIcon class={ListBoxItemChevron} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportExportSettingsView;
