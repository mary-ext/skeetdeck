import { Show, batch, createResource, createSignal } from 'solid-js';
import { modifyMutable, reconcile } from 'solid-js/store';

import { openModal } from '~/com/globals/modals';

import { preferences } from '~/desktop/globals/settings';

import { backupSchema, fromBackup } from '~/desktop/lib/settings/backup';

import { IconButton } from '~/com/primitives/icon-button';
import { ListBox, ListBoxItemIcon, ListBoxItemInteractive, ListGroup } from '~/com/primitives/list-box';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import UploadIcon from '~/com/icons/baseline-upload';

import { useViewRouter } from '../_router';

const ImportSettingsView = () => {
	let inputEl: HTMLInputElement;

	const router = useViewRouter();

	const [file, setFile] = createSignal<File>();

	const [backup] = createResource(file, async (file) => {
		const json = JSON.parse(await file.text());
		const parsed = backupSchema.parse(json, { mode: 'strict' });

		return parsed;
	});

	const handleSubmit = () => {
		const $backup = backup.latest!;
		const merging = fromBackup($backup, false);

		openModal(() => (
			<ConfirmDialog
				title="Import your settings?"
				body="Your current settings will be entirely replaced, this can't be undone."
				confirmation="Import"
				onConfirm={() => {
					batch(() => {
						setFile();
						modifyMutable(preferences, reconcile(merging, { merge: true }));
					});
				}}
			/>
		));
	};

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

				<h2 class="grow text-base font-bold">Import settings</h2>
			</div>

			<input
				ref={(node) => {
					inputEl = node;
				}}
				type="file"
				class="hidden"
				onChange={(ev) => {
					const files = ev.target.files;

					if (files && files.length > 0) {
						setFile(files[0]);
					}
				}}
			/>

			<div class="flex-col flex grow gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<div class={ListBox}>
						<button class={ListBoxItemInteractive} onClick={() => inputEl.click()}>
							<div class="grow min-w-0">
								<p class="grow font-medium">Backup file</p>
								<p class="text-de text-muted-fg text-ellipsis overflow-hidden whitespace-nowrap">
									{file()?.name ?? `No file selected`}
								</p>
							</div>
						</button>
					</div>

					<div class={ListBox}>
						<button
							type="submit"
							disabled={!file() || backup.state !== 'ready'}
							onClick={handleSubmit}
							class={ListBoxItemInteractive}
						>
							<UploadIcon class={ListBoxItemIcon} />
							<span class="grow font-medium">Import settings</span>
						</button>
					</div>

					<Show when={backup.error}>
						{(err) => <p class="text-de text-red-600 dark:text-red-400 whitespace-pre-wrap">{'' + err()}</p>}
					</Show>
				</div>
			</div>
		</div>
	);
};

export default ImportSettingsView;
