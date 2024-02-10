import { createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import TextareaAutosize from 'solid-textarea-autosize';

import type { AtUri, DID, UnionOf } from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';

import { EOF_WS_RE } from '~/api/richtext/composer';
import { graphemeLen } from '~/api/richtext/intl';

import { formatLong } from '~/utils/intl/number';

import { closeModal, useModalState } from '../../globals/modals';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot } from '../../primitives/dialog';
import { IconButton } from '../../primitives/icon-button';
import { Textarea } from '../../primitives/textarea';

import DialogOverlay from './DialogOverlay';

import CloseIcon from '../../icons/baseline-close';

export type ReportMessage =
	| { type: 'feed'; uri: AtUri; cid: string }
	| { type: 'list'; uri: AtUri; cid: string }
	| { type: 'post'; uri: AtUri; cid: string }
	| { type: 'profile'; did: DID };

export interface ReportDialogProps {
	/** Expected to be static */
	uid: DID;
	/** Expected to be static */
	report: ReportMessage;
}

const MAX_DESCRIPTION_LENGTH = 2000;

const enum AppealStep {
	EXPLAIN,
	FINISHED,
}

const ReportDialog = (props: ReportDialogProps) => {
	const uid = props.uid;
	const report = props.report;

	const { disableBackdropClose } = useModalState();

	const [step, setStep] = createSignal(AppealStep.EXPLAIN);

	const [reason, setReason] = createSignal('');

	const actualReason = createMemo(() => reason().replace(EOF_WS_RE, ''));
	const length = createMemo(() => graphemeLen(actualReason()));

	const mutation = createMutation(() => ({
		mutationFn: async () => {
			const $reason = reason();

			const agent = await multiagent.connect(uid);

			let subject: UnionOf<'com.atproto.admin.defs#repoRef'> | UnionOf<'com.atproto.repo.strongRef'>;

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

			await agent.rpc.call('com.atproto.moderation.createReport', {
				data: {
					reasonType: 'com.atproto.moderation.defs#reasonAppeal',
					subject: subject,
					reason: $reason,
				},
			});
		},
		onSuccess: () => {
			setStep(AppealStep.FINISHED);
		},
	}));

	return (
		<DialogOverlay>
			<fieldset
				disabled={(disableBackdropClose.value = mutation.isPending)}
				class={/* @once */ DialogRoot({ size: 'sm', maxHeight: 'sm', fullHeight: true })}
			>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					<button title="Close dialog" onClick={closeModal} class={/* @once */ IconButton({ edge: 'left' })}>
						<CloseIcon />
					</button>

					<div class="flex min-w-0 grow flex-col gap-0.5">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
							Appeal content warning
						</p>

						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
							{/* @once */ '@' + getAccountHandle(uid)}
						</p>
					</div>
				</div>

				{(() => {
					const $step = step();

					const dialogBody = DialogBody({ class: `flex flex-col py-4`, scrollable: true, padded: false });

					if ($step === AppealStep.EXPLAIN) {
						return (
							<div class={dialogBody}>
								<p class="px-4 text-sm">Please tell us why you think it was incorrectly applied.</p>

								<label class="block px-4 pt-3">
									<span class="mb-2 flex items-center justify-between gap-2 text-sm leading-6 text-muted-fg">
										<span>Reason</span>

										<span
											class={'text-xs' + (length() > MAX_DESCRIPTION_LENGTH ? ' font-bold text-red-500' : '')}
										>
											{`${formatLong(length())}/${formatLong(MAX_DESCRIPTION_LENGTH)}`}
										</span>
									</span>

									<TextareaAutosize
										ref={(node) => {
											setTimeout(() => node.focus(), 0);
										}}
										value={reason()}
										onInput={(ev) => setReason(ev.target.value)}
										minRows={6}
										class={/* @once */ Textarea()}
									/>
								</label>

								{(() => {
									if (mutation.error) {
										return (
											<div class="px-4 pt-4 text-sm text-red-500">
												<p>Something went wrong, please try again later.</p>
												<p>{'' + mutation.error}</p>
											</div>
										);
									}
								})()}
							</div>
						);
					}

					if ($step === AppealStep.FINISHED) {
						return (
							<div class={dialogBody}>
								<p class="px-4 text-sm">Appeal sent, we'll look into it promptly.</p>
							</div>
						);
					}
				})()}

				<div class={/* @once */ DialogActions()}>
					<button
						disabled={step() === AppealStep.EXPLAIN && (length() === 0 || length() > MAX_DESCRIPTION_LENGTH)}
						onClick={() => {
							const $step = step();

							if ($step === AppealStep.EXPLAIN) {
								mutation.mutate();
							} else {
								closeModal();
							}
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						{(() => {
							const $step = step();

							if ($step === AppealStep.EXPLAIN) {
								return `Submit`;
							}

							if ($step === AppealStep.FINISHED) {
								return `Close`;
							}

							return `Next`;
						})()}
					</button>
				</div>
			</fieldset>
		</DialogOverlay>
	);
};

export default ReportDialog;
