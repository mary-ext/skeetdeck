import { For, Show, batch, createMemo, createSignal } from 'solid-js';

import { withProxy } from '@mary/bluesky-client/xrpc';

import { createMutation } from '@mary/solid-query';

import TextareaAutosize from 'solid-textarea-autosize';

import type {
	At,
	Brand,
	ComAtprotoAdminDefs,
	ComAtprotoModerationDefs,
	ComAtprotoRepoStrongRef,
} from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';

import type { ModerationService } from '~/api/moderation';

import { EOF_WS_RE } from '~/api/richtext/composer';
import { graphemeLen } from '~/api/richtext/intl';

import { autofocus, model, refs } from '~/utils/input';
import { clsx, getUniqueId } from '~/utils/misc';

import { closeModal, useModalState } from '../../globals/modals';
import { getModerationOptions } from '../../globals/shared';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot } from '../../primitives/dialog';
import { IconButton } from '../../primitives/icon-button';
import {
	ListBox,
	ListBoxItem,
	ListBoxItemChevron,
	ListBoxItemInteractive,
	ListGroup,
	ListGroupHeader,
} from '../../primitives/list-box';
import { Textarea } from '../../primitives/textarea';

import DialogOverlay from './DialogOverlay';

import ArrowLeftIcon from '../../icons/baseline-arrow-left';
import ChevronRightIcon from '../../icons/baseline-chevron-right';
import CloseIcon from '../../icons/baseline-close';

import DefaultLabelerAvatar from '../../assets/default-labeler-avatar.svg?url';

const enum ReportType {
	PROFILE = 1 << 0,
	POST = 1 << 1,
	LIST = 1 << 2,
	FEED = 1 << 3,
}

export type ReportTarget =
	| { type: 'feed'; uri: At.Uri; cid: string }
	| { type: 'list'; uri: At.Uri; cid: string }
	| { type: 'post'; uri: At.Uri; cid: string }
	| { type: 'profile'; did: At.DID };

const REPORT_MAPPING: Record<ReportTarget['type'], ReportType> = {
	feed: ReportType.FEED,
	list: ReportType.LIST,
	post: ReportType.POST,
	profile: ReportType.PROFILE,
};

interface ReportOption {
	flags: number;
	value: ComAtprotoModerationDefs.ReasonType;
	name: string;
	desc: string;
}

const REPORT_OPTIONS: ReportOption[] = [
	{
		flags: ReportType.PROFILE,
		value: 'com.atproto.moderation.defs#reasonMisleading',
		name: 'Misleading account',
		desc: 'False claims about identity or affiliation',
	},

	{
		flags: ReportType.POST | ReportType.LIST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonRude',
		name: 'Anti-social behavior',
		desc: 'Harassment, trolling or intolerance',
	},

	{
		flags: ReportType.PROFILE | ReportType.LIST,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Community standards violation',
		desc: 'Contains terms that violate community standards',
	},

	{
		flags: ReportType.POST,
		value: 'com.atproto.moderation.defs#reasonSexual',
		name: 'Unwanted sexual content',
		desc: 'Nudity or adult content not labeled as such',
	},

	{
		flags: ReportType.POST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonViolation',
		name: 'Illegal and urgent',
		desc: 'Glaring violations of law or terms of service',
	},

	{
		flags: ReportType.POST | ReportType.PROFILE,
		value: 'com.atproto.moderation.defs#reasonSpam',
		name: 'Spam',
		desc: 'Excessive mentions or replies',
	},

	{
		flags: ReportType.POST | ReportType.PROFILE | ReportType.LIST | ReportType.FEED,
		value: 'com.atproto.moderation.defs#reasonOther',
		name: 'Other issues',
		desc: 'Issues not covered by the options above',
	},
];

export interface ReportDialogProps {
	/** Expected to be static */
	uid: At.DID;
	/** Expected to be static */
	report: ReportTarget;
}

const DMCA_LINK = 'https://bsky.social/about/support/copyright';

const MAX_DESCRIPTION_LENGTH = 300;

const enum ReportStep {
	CHOOSE_LABELER,
	CHOOSE_TYPE,
	EXPLAIN,
	FINISHED,
}

const ReportDialog = (props: ReportDialogProps) => {
	const uid = props.uid;
	const report = props.report;

	const mask = REPORT_MAPPING[report.type];

	const { disableBackdropClose } = useModalState();

	const [step, setStep] = createSignal(ReportStep.CHOOSE_LABELER);

	const [reason, setReason] = createSignal<ReportOption>();
	const [explain, setExplain] = createSignal('');
	const [service, setService] = createSignal<ModerationService>();

	const actualExplain = createMemo(() => explain().replace(EOF_WS_RE, ''));
	const length = createMemo(() => graphemeLen(actualExplain()));

	const formId = getUniqueId();

	const mutation = createMutation(() => ({
		mutationFn: async () => {
			const $type = reason()!;
			const $explain = actualExplain();
			const $service = service()!;

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

			const proxied = withProxy(rpc, { service: $service.did, type: 'atproto_labeler' });

			await proxied.call('com.atproto.moderation.createReport', {
				data: {
					subject: subject,
					reasonType: $type!.value,
					reason: $explain,
				},
			});
		},
		onSuccess: () => {
			setStep(ReportStep.FINISHED);
		},
	}));

	const canGoBack = createMemo(() => {
		const $step = step();
		return $step === ReportStep.CHOOSE_TYPE || $step === ReportStep.EXPLAIN;
	});

	return (
		<DialogOverlay>
			<fieldset
				disabled={(disableBackdropClose.value = mutation.isPending)}
				class={/* @once */ DialogRoot({ size: 'sm', maxHeight: 'sm', fullHeight: true })}
			>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					{(() => {
						if (canGoBack()) {
							return (
								<button
									title="Go back to previous page"
									onClick={() => {
										const $step = step();

										if ($step === ReportStep.CHOOSE_TYPE) {
											setStep(ReportStep.CHOOSE_LABELER);
										} else if ($step === ReportStep.EXPLAIN) {
											setStep(ReportStep.CHOOSE_TYPE);
										}
									}}
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

					if ($step === ReportStep.CHOOSE_LABELER) {
						return (
							<div
								class={
									/* @once */ DialogBody({
										scrollable: true,
										padded: false,
										class: `flex flex-col gap-4 p-4`,
									})
								}
							>
								<div>
									<p class="text-base font-bold">Who's the report for?</p>
									<p class="text-sm text-muted-fg">Choose the label provider you want to send reports to</p>
								</div>

								<div class={ListBox}>
									<For
										each={getModerationOptions().services}
										fallback={
											<div class={ListBoxItem}>
												<i class="text-muted-fg">No label providers</i>
											</div>
										}
									>
										{(service) => {
											const profile = service.profile;

											return (
												<button
													onClick={() => {
														batch(() => {
															setService(service);
															setStep(ReportStep.CHOOSE_TYPE);
														});
													}}
													class={ListBoxItemInteractive}
												>
													<img
														src={profile.avatar || DefaultLabelerAvatar}
														class="mt-1 h-8 w-8 shrink-0 self-start rounded-md"
													/>

													<div class="flex min-w-0 grow flex-col text-sm">
														<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
															{profile.displayName}
														</p>
														<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-muted-fg">
															{'@' + profile.handle}
														</p>

														<p class="mt-1 text-de empty:hidden">{profile.description}</p>
													</div>

													<ChevronRightIcon class="mt-2.5 shrink-0 self-start text-xl text-muted-fg" />
												</button>
											);
										}}
									</For>
								</div>

								<p class="text-sm text-muted-fg">
									For copyright violations,{' '}
									<a href={DMCA_LINK} target="_blank" class="text-accent hover:underline">
										click here
									</a>
									.
								</p>
							</div>
						);
					}

					if ($step === ReportStep.CHOOSE_TYPE) {
						return (
							<div
								class={
									/* @once */ DialogBody({
										scrollable: true,
										padded: false,
										class: `flex flex-col gap-6 p-4`,
									})
								}
							>
								<ServiceInfo service={service()} />

								<div class={ListGroup}>
									<p class={ListGroupHeader}>What are you reporting?</p>

									<div class={ListBox}>
										{REPORT_OPTIONS.map((option) => {
											if (!(option.flags & mask)) {
												return;
											}

											return (
												<button
													onClick={() => {
														batch(() => {
															if (reason() !== option) {
																setExplain('');
															}

															setReason(option);
															setStep(ReportStep.EXPLAIN);
														});
													}}
													class={ListBoxItemInteractive}
												>
													<div class="flex min-w-0 grow flex-col text-sm">
														<p class="overflow-hidden text-ellipsis empty:hidden">
															{/* @once */ option.name}
														</p>
														<p class="overflow-hidden text-ellipsis text-de text-muted-fg">
															{/* @once */ option.desc}
														</p>
													</div>

													<ChevronRightIcon class={ListBoxItemChevron + ` mt-2.5 self-start`} />
												</button>
											);
										})}
									</div>
								</div>
							</div>
						);
					}

					if ($step === ReportStep.EXPLAIN) {
						return (
							<>
								<div
									class={
										/* @once */ DialogBody({
											scrollable: true,
											padded: false,
											class: `flex flex-col gap-6 px-4 pt-4`,
										})
									}
								>
									<ServiceInfo service={service()} />

									<div class={ListGroup}>
										<p class={ListGroupHeader}>Selected report option</p>

										<Show when={reason()} keyed>
											{(reason) => {
												return (
													<div class={ListBox}>
														<div class={ListBoxItem}>
															<div class="flex min-w-0 grow flex-col text-sm">
																<p class="overflow-hidden text-ellipsis font-bold empty:hidden">
																	{/* @once */ reason.name}
																</p>
																<p class="overflow-hidden text-ellipsis text-de text-muted-fg">
																	{/* @once */ reason.desc}
																</p>
															</div>
														</div>
													</div>
												);
											}}
										</Show>
									</div>

									<div class={ListGroup}>
										<label for={formId} class={ListGroupHeader}>
											Any additional information?
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
									<button
										onClick={() => {
											mutation.mutate();
										}}
										class={/* @once */ Button({ variant: 'primary' })}
									>
										Submit
									</button>
								</div>
							</>
						);
					}

					if ($step === ReportStep.FINISHED) {
						const renderServiceName = () => {
							const $service = service();
							if ($service) {
								const profile = $service.profile;
								return profile.displayName || `@${profile.handle}`;
							}
						};

						return (
							<>
								<div
									class={
										/* @once */ DialogBody({
											scrollable: true,
											padded: false,
											class: `flex flex-col gap-4 p-4`,
										})
									}
								>
									<div>
										<p class="text-base font-bold">Thanks for reporting!</p>
										<p class="text-sm text-muted-fg">
											Your report has been successfully forwarded to <b>{renderServiceName()}</b>.
										</p>
									</div>
								</div>

								<div class={/* @once */ DialogActions()}>
									<button
										ref={refs(autofocus)}
										onClick={closeModal}
										class={/* @once */ Button({ variant: 'primary' })}
									>
										Dismiss
									</button>
								</div>
							</>
						);
					}
				})()}
			</fieldset>
		</DialogOverlay>
	);
};

export default ReportDialog;

const ServiceInfo = (props: { service: ModerationService | undefined }) => {
	return (
		<Show when={props.service} keyed>
			{(service) => {
				const profile = service.profile;

				return (
					<div class="mt-1 flex items-start gap-4">
						<img
							src={profile.avatar || DefaultLabelerAvatar}
							class="h-10 w-10 shrink-0 self-start rounded-md"
						/>

						<div class="flex min-w-0 grow flex-col text-sm">
							<p class="overflow-hidden text-ellipsis text-sm font-bold empty:hidden">
								{profile.displayName}
							</p>
							<p class="overflow-hidden text-ellipsis text-de text-muted-fg">{'@' + profile.handle}</p>
						</div>
					</div>
				);
			}}
		</Show>
	);
};
