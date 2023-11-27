import { formatBytes } from '~/utils/intl/bytes.ts';
import type { PendingImage } from '~/utils/image.ts';

import { closeModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';

import DialogOverlay from './DialogOverlay.tsx';
import BlobImage from '../BlobImage.tsx';

export interface ImageCompressAlertDialogProps {
	images: PendingImage[];
	onConfirm: () => void;
}

const ImageCompressAlertDialog = (props: ImageCompressAlertDialogProps) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Image has been adjusted</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, scrollable: true })}>
					<p class="text-sm">
						The images you tried inserting has been adjusted to fit within the upload limits, would you like
						to proceed?
					</p>

					<div class="mt-4 flex flex-col gap-2">
						{props.images.map((image) => {
							const before = image.before;
							const after = image.after;

							return (
								<div class="flex items-center gap-3">
									<BlobImage
										src={/* @once */ image.blob}
										class="w-20 shrink-0 rounded-md object-contain"
										style={/* @once */ `aspect-ratio: ${after.width}/${after.height}; max-height: 80px`}
									/>

									<div class="flex min-w-0 flex-col gap-0.5 text-sm">
										<p class="line-clamp-1 break-words font-bold">{/* @once */ image.name}</p>
										<p>{/* @once */ `${before.width}x${before.height} → ${after.width}x${after.height}`}</p>
										<p>
											<span>{/* @once */ `${formatBytes(before.size)} → ${formatBytes(after.size)}`}</span>{' '}
											<span class="whitespace-nowrap text-muted-fg">{
												/* @once */ `(${image.quality}% quality)`
											}</span>
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button
						onClick={() => {
							closeModal();
							props.onConfirm();
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Confirm
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default ImageCompressAlertDialog;
