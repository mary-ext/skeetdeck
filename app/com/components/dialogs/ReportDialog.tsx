import { createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import TextareaAutosize from 'solid-textarea-autosize';

import type {
	At,
	Brand,
	ComAtprotoAdminDefs,
	ComAtprotoModerationDefs,
	ComAtprotoRepoStrongRef,
} from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';

import { EOF_WS_RE } from '~/api/richtext/composer';
import { graphemeLen } from '~/api/richtext/intl';

import { formatLong } from '~/utils/intl/number';
import { createRadioModel } from '~/utils/input';
import { getUniqueId } from '~/utils/misc';

import { closeModal, useModalState } from '../../globals/modals';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot } from '../../primitives/dialog';
import { IconButton } from '../../primitives/icon-button';
import { Textarea } from '../../primitives/textarea';

import DialogOverlay from './DialogOverlay';
import Radio from '../inputs/Radio';

import ArrowLeftIcon from '../../icons/baseline-arrow-left';
import CloseIcon from '../../icons/baseline-close';

const enum ReportType {
	PROFILE = 1 << 0,
	POST = 1 << 1,
	LIST = 1 << 2,
	FEED = 1 << 3,
}

export type ReportMessage =
	| { type: 'feed'; uri: At.Uri; cid: string }
	| { type: 'list'; uri: At.Uri; cid: string }
	| { type: 'post'; uri: At.Uri; cid: string }
	| { type: 'profile'; did: At.DID };

const REPORT_MAPPING: Record<ReportMessage['type'], ReportType> = {
	feed: ReportType.FEED,
	list: ReportType.LIST,
	post: ReportType.POST,
	profile: ReportType.PROFILE,
};

interface ReportOption {
	label: number;
	value: ComAtprotoModerationDefs.ReasonType;
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
	uid: At.DID;
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

				<form
					onSubmit={(ev) => {
						const $step = step();

						ev.preventDefault();

						if ($step === ReportStep.CHOOSE) {
							setStep(ReportStep.EXPLAIN);
						} else if ($step === ReportStep.EXPLAIN) {
							mutation.mutate();
						} else {
							closeModal();
						}
					}}
					class="contents"
				>
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
												class={
													'text-xs' + (length() > MAX_DESCRIPTION_LENGTH ? ' font-bold text-red-500' : '')
												}
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
							type="submit"
							disabled={
								(step() === ReportStep.EXPLAIN && length() > MAX_DESCRIPTION_LENGTH) ||
								(step() === ReportStep.CHOOSE && !type())
							}
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
				</form>
			</fieldset>
		</DialogOverlay>
	);
};

export default ReportDialog;
