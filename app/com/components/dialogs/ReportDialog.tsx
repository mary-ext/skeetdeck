import { createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import TextareaAutosize from 'solid-textarea-autosize';

import type { AtUri, DID, RefOf, UnionOf } from '~/api/atp-schema.ts';
import { getAccountHandle, multiagent } from '~/api/globals/agent.ts';

import { EOF_WS_RE } from '~/api/richtext/composer.ts';
import { graphemeLen } from '~/api/richtext/intl.ts';

import { formatLong } from '~/utils/intl/number.ts';
import { createRadioModel } from '~/utils/input.ts';
import { getUniqueId } from '~/utils/misc.ts';

import { closeModal, useModalState } from '../../globals/modals.tsx';

import { Button } from '../../primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot } from '../../primitives/dialog.ts';
import { IconButton } from '../../primitives/icon-button.ts';
import { Textarea } from '../../primitives/textarea.ts';

import DialogOverlay from './DialogOverlay.tsx';
import Radio from '../inputs/Radio.tsx';

import ArrowLeftIcon from '../../icons/baseline-arrow-left.tsx';
import CloseIcon from '../../icons/baseline-close.tsx';

const enum ReportType {
	PROFILE = 1 << 0,
	POST = 1 << 1,
	LIST = 1 << 2,
	FEED = 1 << 3,
}

export type ReportMessage =
	| { type: 'feed'; uri: AtUri; cid: string }
	| { type: 'list'; uri: AtUri; cid: string }
	| { type: 'post'; uri: AtUri; cid: string }
	| { type: 'profile'; did: DID };

const REPORT_MAPPING: Record<ReportMessage['type'], ReportType> = {
	feed: ReportType.FEED,
	list: ReportType.LIST,
	post: ReportType.POST,
	profile: ReportType.PROFILE,
};

interface ReportOption {
	label: number;
	value: RefOf<'com.atproto.moderation.defs#reasonType'>;
	name: string;
	desc: string;
}

const REPORT_OPTIONS: ReportOption[] = [
	{
		label: ReportType.PROFILE,
		value: 'com.atproto.moderation.defs#reasonMisleading',
		name: 'Misleading profile',
		desc: 'False claims about identity or affiliation',
	},

	{
		label: ReportType.POST | ReportType.LIST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonRude',
		name: 'Anti-social behavior',
		desc: 'Harassment, trolling or intolerance',
	},

	{
		label: ReportType.PROFILE | ReportType.LIST,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Community standards violation',
		desc: 'Contains terms that violate community standards',
	},

	{
		label: ReportType.POST,
		value: 'com.atproto.moderation.defs#reasonSexual',
		name: 'Unwanted sexual content',
		desc: 'Nudity or pornography not labeled as such',
	},

	{
		label: ReportType.POST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Illegal and urgent',
		desc: 'Glaring violations of law or terms of service',
	},

	{
		label: ReportType.POST | ReportType.PROFILE,
		value: 'com.atproto.moderation.defs#reasonSpam',
		name: 'Spam',
		desc: 'Excessive mentions or replies',
	},

	{
		label: ReportType.POST | ReportType.LIST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonOther',
		name: 'Other issues',
		desc: 'Issues not covered by the options above',
	},
];

export interface ReportDialogProps {
	/** Expected to be static */
	uid: DID;
	/** Expected to be static */
	report: ReportMessage;
}

const DMCA_LINK = 'https://blueskyweb.xyz/support/copyright';

const MAX_DESCRIPTION_LENGTH = 2000;

const enum ReportStep {
	CHOOSE,
	EXPLAIN,
	FINISHED,
}

const ReportDialog = (props: ReportDialogProps) => {
	const uid = props.uid;
	const report = props.report;

	const mask = REPORT_MAPPING[report.type];

	const { disableBackdropClose } = useModalState();

	const [step, setStep] = createSignal(ReportStep.CHOOSE);

	const [type, setType] = createSignal<ReportOption>();
	const [reason, setReason] = createSignal('');

	const actualReason = createMemo(() => reason().replace(EOF_WS_RE, ''));
	const length = createMemo(() => graphemeLen(actualReason()));

	const formId = getUniqueId();

	const mutation = createMutation(() => ({
		mutationFn: async () => {
			const $type = type()!;
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
					reasonType: $type!.value,
					subject: subject,
					reason: $reason,
				},
			});
		},
		onSuccess: () => {
			setStep(ReportStep.FINISHED);
		},
	}));

	return (
		<DialogOverlay>
			<fieldset
				disabled={(disableBackdropClose.value = mutation.isPending)}
				class={/* @once */ DialogRoot({ size: 'sm', maxHeight: 'sm', fullHeight: true })}
			>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					{(() => {
						if (step() === ReportStep.EXPLAIN) {
							return (
								<button
									title="Return to previous screen"
									onClick={() => setStep(ReportStep.CHOOSE)}
									class={/* @once */ IconButton({ edge: 'left' })}
								>
									<ArrowLeftIcon />
								</button>
							);
						}

						return (
							<button
								title="Close dialog"
								onClick={closeModal}
								class={/* @once */ IconButton({ edge: 'left' })}
							>
								<CloseIcon />
							</button>
						);
					})()}

					<div class="flex min-w-0 grow flex-col gap-0.5">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
							Report content
						</p>

						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
							{/* @once */ '@' + getAccountHandle(uid)}
						</p>
					</div>
				</div>

				{(() => {
					const $step = step();

					const dialogBody = DialogBody({ class: `flex flex-col py-4`, scrollable: true, padded: false });

					if ($step === ReportStep.CHOOSE) {
						const typeModel = createRadioModel(type, setType);

						return (
							<div class={dialogBody}>
								<div class="px-4 pb-3">
									<p class="font-bold">What's happening?</p>
									<p class="text-sm text-muted-fg">Select the option that applies for this content</p>
								</div>

								<div>
									{REPORT_OPTIONS.map((option) => {
										if (!(option.label & mask)) {
											return;
										}

										return (
											<label class="block px-4 py-3">
												<div class="flex min-w-0 justify-between gap-4">
													<span class="text-sm">{/* @once */ option.name}</span>

													<Radio ref={typeModel(option)} name={formId} />
												</div>
												<p class="mr-6 text-de text-muted-fg">{/* @once */ option.desc}</p>
											</label>
										);
									})}
								</div>

								{mask & ReportType.PROFILE ? (
									<p class="px-4 pt-3 text-sm text-muted-fg">
										For other issues, please report the specific posts.
									</p>
								) : null}

								{mask & ReportType.POST ? (
									<p class="px-4 pt-3 text-sm text-muted-fg">
										For copyright violations,{' '}
										<a href={DMCA_LINK} target="_blank" class="text-accent hover:underline">
											click here
										</a>
										.
									</p>
								) : null}
							</div>
						);
					}

					if ($step === ReportStep.EXPLAIN) {
						const $type = type()!;

						return (
							<div class={dialogBody}>
								<p class="px-4 text-sm">
									You're reporting for <span class="font-bold">{/* @once */ $type.name}</span>.
								</p>

								<label class="block px-4 pt-3">
									<span class="mb-2 flex items-center justify-between gap-2 text-sm leading-6 text-muted-fg">
										<span>Any additional details?</span>

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

					if ($step === ReportStep.FINISHED) {
						return (
							<div class={dialogBody}>
								<p class="px-4 text-sm">Thanks for your report, we'll look into it promptly.</p>
							</div>
						);
					}
				})()}

				<div class={/* @once */ DialogActions()}>
					<button
						disabled={
							(step() === ReportStep.EXPLAIN && length() > MAX_DESCRIPTION_LENGTH) ||
							(step() === ReportStep.CHOOSE && !type())
						}
						onClick={() => {
							const $step = step();

							if ($step === ReportStep.CHOOSE) {
								setStep(ReportStep.EXPLAIN);
							} else if ($step === ReportStep.EXPLAIN) {
								mutation.mutate();
							} else {
								closeModal();
							}
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						{(() => {
							const $step = step();

							if ($step === ReportStep.EXPLAIN) {
								return `Submit`;
							}

							if ($step === ReportStep.FINISHED) {
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
