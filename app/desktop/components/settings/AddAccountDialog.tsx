import { batch, createEffect, createSignal, lazy } from 'solid-js';

import { getPdsEndpoint } from '@mary/bluesky-client';
import { XRPCError } from '@mary/bluesky-client/xrpc';

import { createMutation } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import { getDidInfo } from '~/api/did';
import { multiagent } from '~/api/globals/agent';
import { DEFAULT_DATA_SERVERS } from '~/api/globals/defaults';
import { MultiagentError } from '~/api/classes/multiagent';
import { formatQueryError } from '~/api/utils/misc';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';

import { model, mutationAutofocus, refs } from '~/utils/input';

import { closeModal, openModal, useModalState } from '~/com/globals/modals';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';

import GlobeIcon from '~/com/icons/baseline-globe';
import EditIcon from '~/com/icons/baseline-edit';

const ChooseServiceDialog = lazy(() => import('./ChooseServiceDialog'));

const APP_PASSWORD_LINK = 'https://atproto.com/community/projects#app-passwords';

const enum Steps {
	IDENTIFIER,
	PASSWORD,
}

const formatEmailOtpCode = (code: string) => {
	let str = code.toUpperCase();

	if (!code.includes('-')) {
		str = str.slice(0, 5) + '-' + str.slice(5);
	}

	return str;
};

const isOtpError = (err: unknown): boolean => {
	return (
		err instanceof XRPCError &&
		(err.kind === 'AuthFactorTokenRequired' || err.message.includes('Token is invalid'))
	);
};

const AddAccountDialog = () => {
	const { disableBackdropClose } = useModalState();

	const [step, setStep] = createSignal(Steps.IDENTIFIER);
	const [tfaRequired, setTfaRequired] = createSignal(false);

	const [service, setService] = createSignal(DEFAULT_DATA_SERVERS[0]);

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');
	const [code, setCode] = createSignal('');

	const loginMutation = createMutation((queryClient) => {
		return {
			mutationFn: async () => {
				const $identifier = identifier().trim();
				const $password = password();
				const $service = service();
				const $code = tfaRequired() ? code().trim() : undefined;

				const uid = await multiagent.login({
					service: $service.url,
					identifier: $identifier,
					password: $password,
					code: $code,
				});

				return uid;
			},
			onSuccess(uid: At.DID) {
				closeModal();

				// Invalidate any queries involving this DID,
				// in the case that we're signing in to an already added account.
				queryClient.invalidateQueries({
					predicate: (query) => {
						const key = query.queryKey;
						return key.length >= 2 && key[1] === uid && !(key[0] as string).includes('/');
					},
				});

				// Fetch the profile while we're at it,
				// let's set the GC time to 1 minute just in case.
				queryClient.fetchQuery({
					queryKey: getProfileKey(uid, uid),
					queryFn: getProfile,
					gcTime: 60 * 1_000,
				});
			},
			onError(err) {
				if (err instanceof XRPCError && err.kind === 'AuthFactorTokenRequired') {
					setTfaRequired(true);
				}
			},
		};
	});

	const pdsMutation = createMutation(() => {
		return {
			mutationFn: async ({ ident }: { ident: string }) => {
				const didDoc = await getDidInfo(ident);

				const pds = getPdsEndpoint(didDoc);
				if (!pds) {
					throw new Error(`No PDS found`);
				}

				const url = new URL(pds);
				const host = url.host;
				const isBskySocial = host.endsWith('.host.bsky.network');

				setService({
					name: !isBskySocial ? host : 'Bluesky Social',
					url: pds,
				});

				setStep(Steps.PASSWORD);
			},
		};
	});

	const handleSubmit = (ev: SubmitEvent) => {
		const form = new FormData(ev.currentTarget as HTMLFormElement, ev.submitter);
		const $step = step();

		ev.preventDefault();

		if ($step === Steps.IDENTIFIER) {
			const noResolution = form.has('no_resolution');

			// Normalize identifier
			const $identifier = identifier().trim().replace(/^@/, '');
			setIdentifier($identifier);

			if (noResolution || $identifier.indexOf('@') > 0) {
				// Email login
				setService(DEFAULT_DATA_SERVERS[0]);
				setStep(Steps.PASSWORD);
			} else {
				// Handle/DID login
				pdsMutation.mutate({ ident: $identifier });
			}
		} else if ($step === Steps.PASSWORD) {
			// Normalize OTP code
			const $code = code();
			if ($code !== '') {
				setCode(formatEmailOtpCode($code));
			}

			loginMutation.mutate();
		}
	};

	createEffect(() => {
		disableBackdropClose.value = loginMutation.isPending;
	});

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Add new account</h1>
				</div>

				{(() => {
					const $step = step();

					if ($step === Steps.IDENTIFIER) {
						return (
							<fieldset disabled={pdsMutation.isPending} class="contents">
								<div class={/* @once */ DialogBody({ class: 'flex flex-col gap-2' })}>
									<label class="block">
										<span class="mb-2 block text-sm font-medium leading-6">
											Bluesky handle, DID or email address
										</span>
										<input
											ref={refs(model(identifier, setIdentifier), mutationAutofocus(pdsMutation))}
											name="username"
											type="text"
											required
											pattern=".*\S+.*"
											placeholder="you.bsky.social"
											autocomplete="username"
											class={/* @once */ Input()}
										/>

										<button
											type="button"
											name="no_resolution"
											onClick={(ev) => {
												// implicit form submissions uses the first submit
												// button available, and that's annoying.
												const target = ev.currentTarget;

												target.type = 'submit';

												// can't be done in one tick, for some reason
												setTimeout(() => {
													// reset the type first because lmao
													target.type = 'button';
													target.click();
												}, 0);
											}}
											class="mt-2 text-de text-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
										>
											Continue without automatic service resolution
										</button>
									</label>

									<p class="text-de text-red-500 empty:hidden">
										{(() => {
											const error: unknown = pdsMutation.error;

											if (!error) {
												return;
											}

											if (error instanceof XRPCError) {
												const err = error.kind;

												if (error.message === 'Unable to resolve handle') {
													return `We can't find your account`;
												}

												if (err === 'InvalidRequest') {
													return `Invalid identifier`;
												}
											}

											return formatQueryError(error);
										})()}
									</p>

									<div hidden>
										<input ref={model(password, setPassword)} type="password" />
									</div>
								</div>
							</fieldset>
						);
					}

					if ($step === Steps.PASSWORD) {
						const goBack = () => {
							batch(() => {
								setStep(Steps.IDENTIFIER);
								setTfaRequired(false);

								setPassword('');
								setCode('');

								loginMutation.reset();
							});
						};

						return (
							<fieldset disabled={loginMutation.isPending} class="contents">
								<div class={/* @once */ DialogBody({ scrollable: true, class: 'flex flex-col gap-4' })}>
									<p class="break-words text-sm">
										Signing in as <b>{identifier()}</b>{' '}
										<span class="text-muted-fg">
											(
											<button
												type="button"
												onClick={goBack}
												class="text-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
											>
												not you?
											</button>
											)
										</span>
									</p>

									<div>
										<span class="mb-2 block text-sm font-medium leading-6">Service</span>

										<button
											type="button"
											onClick={() => {
												openModal(() => (
													<ChooseServiceDialog serviceUri={/* @once */ service().url} onSubmit={setService} />
												));
											}}
											class="flex h-9 w-full items-center rounded-md border border-input text-left text-sm outline-2 -outline-offset-1 outline-accent hover:bg-secondary/30 hover:text-secondary-fg focus-visible:outline disabled:pointer-events-none disabled:opacity-50"
										>
											<div class="grid w-9 shrink-0 place-items-center">
												<GlobeIcon class="text-base text-muted-fg" />
											</div>

											<span class="grow">{service().name}</span>

											<div class="grid w-9 shrink-0 place-items-center">
												<EditIcon class="text-base" />
											</div>
										</button>
									</div>

									<label class="block">
										<span class="mb-2 block text-sm font-medium leading-6 text-primary">Password</span>
										<input
											ref={refs(model(password, setPassword), (node) => {
												createEffect((first: boolean) => {
													const error = loginMutation.error;
													const hasError = error && !isOtpError(error);

													if (hasError || first) {
														node.focus();
													}

													return false;
												}, true);
											})}
											type="password"
											required
											placeholder="Password"
											class={/* @once */ Input()}
										/>

										{!tfaRequired() && (
											<p class="mt-2 text-de text-muted-fg">
												Using an app password is recommended.{' '}
												<a target="_blank" href={APP_PASSWORD_LINK} class="text-accent hover:underline">
													Learn more
												</a>
											</p>
										)}
									</label>

									{tfaRequired() && (
										<label class="mb-px block">
											<span class="mb-2 block text-sm font-medium leading-6 text-primary">One-time code</span>

											<input
												ref={refs(model(code, setCode), (node) => {
													createEffect((first: boolean) => {
														const error = loginMutation.error;
														const hasError = error && isOtpError(error);

														if (hasError || first) {
															node.focus();
														}

														return false;
													}, true);
												})}
												type="text"
												required
												autocomplete="one-time-code"
												pattern="[a-zA-Z0-9]{5}-?[a-zA-Z0-9]{5}"
												placeholder="AAAAA-BBBBB"
												class={/* @once */ Input()}
											/>
										</label>
									)}

									<p class="text-de text-red-500 empty:hidden">
										{(() => {
											let error: unknown = loginMutation.error;

											if (!error) {
												return;
											}

											if (error instanceof MultiagentError && error.cause) {
												error = error.cause;
											}

											if (error instanceof XRPCError) {
												const err = error.kind;

												if (err === 'AuthenticationRequired') {
													return `Invalid identifier or password`;
												}
												if (err === 'AccountTakedown') {
													return `Account has been taken down`;
												}

												if (err === 'AuthFactorTokenRequired') {
													return;
												}
												if (error.message.includes('Token is invalid')) {
													return `Incorrect one-time code`;
												}
											}

											return formatQueryError(error);
										})()}
									</p>
								</div>
							</fieldset>
						);
					}
				})()}

				<fieldset disabled={loginMutation.isPending} class={/* @once */ DialogActions()}>
					<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button
						type="submit"
						disabled={pdsMutation.isPending}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						{step() === Steps.IDENTIFIER ? 'Continue' : 'Sign in'}
					</button>
				</fieldset>
			</form>
		</DialogOverlay>
	);
};

export default AddAccountDialog;
