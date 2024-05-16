import { batch, createEffect, createMemo, createSignal } from 'solid-js';

import TextareaAutosize from 'solid-textarea-autosize';

import { withProxy } from '@mary/bluesky-client/xrpc';
import { createMutation } from '@mary/solid-query';

import type {
	At,
	Brand,
	ComAtprotoAdminDefs,
	ComAtprotoLabelDefs,
	ComAtprotoRepoStrongRef,
} from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { EOF_WS_RE } from '~/api/richtext/composer';
import { graphemeLen } from '~/api/richtext/intl';

import { GLOBAL_LABELS, getLocalizedLabel } from '~/api/moderation';

import { autofocus, model, refs } from '~/utils/input';
import { clsx, getUniqueId } from '~/utils/misc';

import { closeModal, useModalState } from '../../globals/modals';
import { getModerationOptions } from '../../globals/shared';

import { IconButton } from '~/com/primitives/icon-button';
import ArrowLeftIcon from '../../icons/baseline-arrow-left';
import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';
import { ListBox, ListBoxItem, ListGroup, ListGroupHeader } from '../../primitives/list-box';
import { Textarea } from '../../primitives/textarea';
import DialogOverlay from './DialogOverlay';

import DefaultLabelerAvatar from '../../assets/default-labeler-avatar.svg?url';

export type ReportTarget =
	| { type: 'feed'; uri: At.Uri; cid: string }
	| { type: 'list'; uri: At.Uri; cid: string }
	| { type: 'post'; uri: At.Uri; cid: string }
	| { type: 'profile'; did: At.DID };

export interface LabelsOnMeDialogProps {
	uid: At.DID;
	report: ReportTarget;
	labels: ComAtprotoLabelDefs.Label[];
}

const enum AppealStep {
	CHOOSE_LABELS,
	EXPLAIN,
	FINISHED,
}

const MAX_DESCRIPTION_LENGTH = 300;

const LabelsOnMeDialog = (props: LabelsOnMeDialogProps) => {
	const uid = props.uid;
	const report = props.report;
	const labels = props.labels;

	const { disableBackdropClose } = useModalState();

	const [step, setStep] = createSignal(AppealStep.CHOOSE_LABELS);
	const [target, setTarget] = createSignal<At.DID>();
	const [explain, setExplain] = createSignal('');

	const actualExplain = createMemo(() => explain().replace(EOF_WS_RE, ''));
	const length = createMemo(() => graphemeLen(actualExplain()));

	const formId = getUniqueId();

	const mutation = createMutation(() => ({
		mutationFn: async () => {
			const $target = target()!;
			const $explain = explain();

			const { rpc } = await multiagent.connect(uid);

			let subject: Brand.Union<ComAtprotoAdminDefs.RepoRef | ComAtprotoRepoStrongRef.Main>;

			if (report.type === 'profile') {
				subject = {
					$type: 'com.atproto.admin.defs#repoRef',
					did: report.did,
				};
			} else {
				subject = {
					$type: 'com.atproto.repo.strongRef',
					uri: report.uri,
					cid: report.cid,
				};
			}

			const proxied = withProxy(rpc, { service: $target, type: 'atproto_labeler' });

			await proxied.call('com.atproto.moderation.createReport', {
				data: {
					subject: subject,
					reasonType: 'com.atproto.moderation.defs#reasonAppeal',
					reason: $explain,
				},
			});
		},
		onSuccess: () => {
			setStep(AppealStep.FINISHED);
		},
	}));

	createEffect(() => {
		disableBackdropClose.value = mutation.isPending;
	});

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					{(() => {
						if (step() === AppealStep.EXPLAIN) {
							return (
								<button
									title="Return to previous screen"
									onClick={() => {
										setStep(AppealStep.CHOOSE_LABELS);
									}}
									class={/* @once */ IconButton({ edge: 'left' })}
								>
									<ArrowLeftIcon />
								</button>
							);
						}
					})()}

					<h1 class={/* @once */ DialogTitle()}>
						{(() => {
							if (step() === AppealStep.EXPLAIN) {
								return `Send moderation appeal`;
							}

							if (step() === AppealStep.FINISHED) {
								return `Appeal sent`;
							}

							return `Labels on my content`;
						})()}
					</h1>
				</div>

				{(() => {
					const $step = step();

					if ($step === AppealStep.CHOOSE_LABELS) {
						const grouped = Array.from(Map.groupBy(labels, (label) => label.src));

						return (
							<>
								<div
									class={
										/* @once */ DialogBody({
											scrollable: true,
											padded: true,
											class: 'flex flex-col gap-6',
										})
									}
								>
									{grouped.map(([did, groupedLabels]) => {
										const service = createMemo(() => {
											return getModerationOptions().services.find((s) => s.did === did);
										});

										return (
											<div class="flex flex-col gap-2">
												{(() => {
													const $service = service();
													const profile = $service?.profile;

													return (
														<div class="flex items-center gap-3 py-0.5">
															<img
																src={profile?.avatar || DefaultLabelerAvatar}
																class="h-7 w-7 shrink-0 overflow-hidden rounded object-cover"
															/>

															<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
																{profile ? profile.displayName || `@${profile.handle}` : did}
															</span>

															<button
																onClick={() => {
																	batch(() => {
																		if (target() !== did) {
																			setExplain('');
																		}

																		setTarget(did);
																		setStep(AppealStep.EXPLAIN);
																	});
																}}
																class={/* @once */ Button({ variant: 'outline', size: 'xs' })}
															>
																Appeal
															</button>
														</div>
													);
												})()}

												<div class={ListBox}>
													{groupedLabels.map((l) => {
														const val = l.val;
														const localized = createMemo(() => {
															const $service = service();

															if ($service && val in $service.defs) {
																return getLocalizedLabel($service.defs[val]);
															} else if (val in GLOBAL_LABELS) {
																return getLocalizedLabel(GLOBAL_LABELS[val]);
															}

															return { i: 'en', n: val, d: '' };
														});

														return (
															<div class={ListBoxItem}>
																<div class="flex min-w-0 grow flex-col text-sm">
																	<p class="overflow-hidden text-ellipsis font-bold empty:hidden">
																		{localized().n}
																	</p>
																	<p class="overflow-hidden text-ellipsis text-de text-muted-fg">
																		{localized().d || <i>No description provided</i>}
																	</p>
																</div>
															</div>
														);
													})}
												</div>
											</div>
										);
									})}
								</div>

								<div class={/* @once */ DialogActions()}>
									<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
										Dismiss
									</button>
								</div>
							</>
						);
					}

					if ($step === AppealStep.EXPLAIN) {
						const service = createMemo(() => {
							const $target = target();
							return getModerationOptions().services.find((s) => s.did === $target);
						});

						return (
							<fieldset disabled={mutation.isPending} class="contents">
								<div
									class={
										/* @once */ DialogBody({
											scrollable: true,
											padded: true,
											class: 'flex flex-col gap-4',
										})
									}
								>
									{(() => {
										const $service = service();
										const profile = $service?.profile;

										return (
											<div class="flex items-center gap-3 py-0.5">
												<img
													src={profile?.avatar || DefaultLabelerAvatar}
													class="h-7 w-7 shrink-0 overflow-hidden rounded object-cover"
												/>

												<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium">
													{profile ? profile.displayName || `@${profile.handle}` : target()}
												</span>
											</div>
										);
									})()}

									<div class={ListGroup}>
										<label for={formId} class={ListGroupHeader}>
											Any explanations why?
										</label>

										<div>
											<TextareaAutosize
												ref={refs<HTMLTextAreaElement>(model(explain, setExplain), autofocus)}
												id={formId}
												minRows={4}
												class={/* @once */ Textarea()}
											/>

											<div class="text-right">
												<span
													class={clsx([
														`text-xs`,
														length() > MAX_DESCRIPTION_LENGTH ? `font-bold text-red-500` : `text-muted-fg`,
													])}
												>
													{`${length()}/${MAX_DESCRIPTION_LENGTH}`}
												</span>
											</div>
										</div>
									</div>

									{(() => {
										if (mutation.error) {
											return (
												<div class="text-sm text-red-500">
													<p>Something went wrong, please try again later.</p>
													<p>{'' + mutation.error}</p>
												</div>
											);
										}
									})()}
								</div>

								<div class={/* @once */ DialogActions()}>
									<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
										Cancel
									</button>

									<button
										onClick={() => {
											mutation.mutate();
										}}
										disabled={length() === 0}
										class={/* @once */ Button({ variant: 'primary' })}
									>
										Submit
									</button>
								</div>
							</fieldset>
						);
					}

					if ($step === AppealStep.FINISHED) {
						return (
							<>
								<div
									class={
										/* @once */ DialogBody({
											scrollable: true,
											padded: true,
											class: 'flex flex-col gap-6',
										})
									}
								>
									<p class="text-sm">Thanks for reporting, your appeal has been sent successfully.</p>
								</div>

								<div class={/* @once */ DialogActions()}>
									<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
										Dismiss
									</button>
								</div>
							</>
						);
					}
				})()}
			</div>
		</DialogOverlay>
	);
};

export default LabelsOnMeDialog;
