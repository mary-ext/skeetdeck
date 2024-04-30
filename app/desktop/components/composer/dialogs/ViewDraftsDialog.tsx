import { For, createResource, lazy, onCleanup } from 'solid-js';

import { closeModal, openModal } from '~/com/globals/modals';

import { formatAbsDateTime } from '~/utils/intl/time';

import { Button } from '~/com/primitives/button';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { IconButton } from '~/com/primitives/icon-button';
import { loadMoreBtn } from '~/com/primitives/interactive';
import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import type { EmbeddedImage } from '~/com/components/dialogs/ImageViewerDialog';
import { Flyout } from '~/com/components/Flyout';
import BlobImage from '~/com/components/BlobImage';

import CloseIcon from '~/com/icons/baseline-close';
import DeleteIcon from '~/com/icons/baseline-delete';
import EditIcon from '~/com/icons/baseline-edit';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import PlaylistAddCheckIcon from '~/com/icons/baseline-playlist-add-check';

import { type ComposerDraft, getDraftDb, type SerializedImage } from '../utils/draft-db';
import { useComposer } from '../ComposerContext';

import { isStateFilled } from '../utils/state';

import ApplyDraftDialog from './drafts/ApplyDraftDialog';
import DeleteDraftDialog from './drafts/DeleteDraftDialog';
import RenameDraftDialog from './drafts/RenameDraftDialog';
import SaveDraftDialog from './drafts/SaveDraftDialog';

const ImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog'));

interface DraftsListResponse {
	cursor: string | undefined;
	drafts: ComposerDraft[];
}

const PER_PAGE = 25;

const ViewDraftsDialog = () => {
	const context = useComposer();

	const [listing, { refetch, mutate }] = createResource<DraftsListResponse, string>(
		async (_, { refetching, value: prev }) => {
			const db = await getDraftDb();
			const tx = db.transaction('drafts');

			const drafts: ComposerDraft[] = [];
			let count = 0;

			const range = typeof refetching === 'string' ? IDBKeyRange.upperBound(refetching, true) : undefined;

			for await (const cursor of tx.store.iterate(range, 'prev')) {
				if (count++ >= PER_PAGE) {
					break;
				}

				drafts.push(cursor.value);
			}

			const nextCursor = count > PER_PAGE ? drafts[count - 2].id : undefined;

			return {
				cursor: nextCursor,
				drafts: range && prev ? prev.drafts.concat(drafts) : drafts,
			};
		},
	);

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm', fullHeight: true })}>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					<button
						title="Close dialog"
						type="button"
						onClick={closeModal}
						class={/* @once */ IconButton({ edge: 'left' })}
					>
						<CloseIcon />
					</button>

					<h1 class={/* @once */ DialogTitle()}>Drafts</h1>

					<button
						disabled={(() => {
							const state = context.state();
							return !state || !isStateFilled(state);
						})()}
						onClick={() => {
							openModal(() => (
								<SaveDraftDialog
									onSave={(draft) => {
										mutate((prev) => {
											if (prev) {
												return {
													...prev,
													drafts: [draft, ...prev.drafts],
												};
											}

											return prev;
										});
									}}
								/>
							));
						}}
						class={/* @once */ Button({ variant: 'outline', size: 'xs' })}
					>
						Save as draft
					</button>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col', scrollable: true, padded: false })}>
					<For each={!listing.error ? listing.latest?.drafts : undefined}>
						{(draft) => {
							const state = draft.state;
							const posts = state.posts;

							const count = posts.length;
							const images = posts.flatMap((post) => post.images);

							return (
								<div class="border-b border-divider px-4 py-3 text-sm">
									<div class="flex gap-4">
										<div class="min-w-0 grow">
											<p class="text-de text-muted-fg">
												<span>{/* @once */ formatAbsDateTime(draft.createdAt)}</span>
												{count > 1 && <span> · {count} posts</span>}
											</p>
											<p class="overflow-hidden text-ellipsis break-words font-bold">
												{/* @once */ draft.title}
											</p>
										</div>

										<div class="-mr-2 flex shrink-0 gap-1 text-primary/85">
											<button
												title="Use this draft"
												onClick={() => {
													openModal(() => (
														<ApplyDraftDialog
															draft={draft}
															onApply={(shouldRemove) => {
																if (shouldRemove) {
																	mutate((prev) => {
																		if (prev) {
																			return {
																				cursor: prev.cursor,
																				drafts: prev.drafts.filter((d) => d !== draft),
																			};
																		}

																		return prev;
																	});
																}
															}}
														/>
													));
												}}
												class={/* @once */ IconButton({ color: 'inherit' })}
											>
												<PlaylistAddCheckIcon />
											</button>

											<Flyout
												button={
													<button title="More actions" class={/* @once */ IconButton({ color: 'inherit' })}>
														<MoreHorizIcon />
													</button>
												}
												placement="bottom-end"
											>
												{({ close, menuProps }) => (
													<div {...menuProps} class={/* @once */ MenuRoot()}>
														<button
															onClick={() => {
																close();
																openModal(() => (
																	<RenameDraftDialog
																		draft={draft}
																		onSave={(next) => {
																			mutate((prev) => {
																				if (prev) {
																					return {
																						...prev,
																						drafts: prev.drafts.map((d) => (d === draft ? next : d)),
																					};
																				}

																				return prev;
																			});
																		}}
																	/>
																));
															}}
															class={/* @once */ MenuItem()}
														>
															<EditIcon class={/* @once */ MenuItemIcon()} />
															<span>Rename draft</span>
														</button>

														<button
															onClick={() => {
																close();
																openModal(() => (
																	<DeleteDraftDialog
																		draft={draft}
																		onDelete={() => {
																			mutate((prev) => {
																				if (prev) {
																					return {
																						...prev,
																						drafts: prev.drafts.filter((d) => d !== draft),
																					};
																				}

																				return prev;
																			});
																		}}
																	/>
																));
															}}
															class={/* @once */ MenuItem({ variant: 'danger' })}
														>
															<DeleteIcon class={/* @once */ MenuItemIcon()} />
															<span>Delete draft</span>
														</button>
													</div>
												)}
											</Flyout>
										</div>
									</div>

									<div class="mt-1 flex gap-4">
										<div class="min-w-0 grow">
											<p class="line-clamp-[4] whitespace-pre-wrap break-words text-de">
												{
													/* @once */ posts.map((post) => post.text).join('\n\n') || (
														<span class="text-muted-fg">{'<no contents>'}</span>
													)
												}
											</p>
										</div>

										<div class="shrink-0 empty:hidden">
											{/* @once */ images.length > 0 && <DraftImagesView images={images} />}
										</div>
									</div>
								</div>
							);
						}}
					</For>

					{(() => {
						const latest = !listing.error && listing.latest;

						if (latest) {
							const cursor = latest.cursor;
							const empty = latest.drafts.length === 0;

							if (cursor) {
								return (
									<button
										onClick={() => {
											refetch(cursor);
										}}
										class={loadMoreBtn}
									>
										Show more drafts
									</button>
								);
							}

							return (
								<div class="grid h-13 shrink-0 place-items-center">
									<p class="text-sm text-muted-fg">{!empty ? `End of list` : `You don't have any drafts`}</p>
								</div>
							);
						}
					})()}
				</div>
			</div>
		</DialogOverlay>
	);
};

export default ViewDraftsDialog;

const DraftImagesView = ({ images }: { images: SerializedImage[] }) => {
	const render = (index: number, standalone: boolean) => {
		const img = images[index];

		return (
			<BlobImage
				src={/* @once */ img.blob}
				alt={/* @once */ img.alt}
				class={`object-cover ` + (standalone ? ` aspect-square w-full` : `min-h-0 grow basis-0`)}
			/>
		);
	};

	return (
		<button
			onClick={() => {
				openModal(() => {
					const array = images.map((img): EmbeddedImage => {
						return {
							fullsize: URL.createObjectURL(img.blob),
							alt: img.alt,
						};
					});

					onCleanup(() => {
						for (let i = 0, il = array.length; i < il; i++) {
							const img = array[i];
							URL.revokeObjectURL(img.fullsize);
						}
					});

					return <ImageViewerDialog images={array} />;
				});
			}}
			class="w-16 overflow-hidden rounded-md border border-divider"
		>
			{(() => {
				if (images.length >= 4) {
					return (
						<div class="flex aspect-square gap-0.5">
							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(0, false)}
								{/* @once */ render(2, false)}
							</div>

							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(1, false)}
								{/* @once */ render(3, false)}
							</div>
						</div>
					);
				}

				if (images.length >= 3) {
					return (
						<div class="flex aspect-square gap-0.5">
							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(0, false)}
								{/* @once */ render(1, false)}
							</div>

							<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(2, false)}</div>
						</div>
					);
				}

				if (images.length >= 2) {
					return (
						<div class="flex aspect-video gap-0.5">
							<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(0, false)}</div>
							<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(1, false)}</div>
						</div>
					);
				}

				if (images.length === 1) {
					return render(0, true);
				}
			})()}
		</button>
	);
};
