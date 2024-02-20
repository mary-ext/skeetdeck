import { For, batch, createSignal, lazy } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import { clsx, getUniqueId } from '~/utils/misc';
import { createRadioModel, modelChecked } from '~/utils/input';

import { openModal } from '~/com/globals/modals';

import { Button } from '~/com/primitives/button';
import { Interactive } from '~/com/primitives/interactive';

import Radio from '~/com/components/inputs/Radio';
import Checkbox from '~/com/components/inputs/Checkbox';

import AddIcon from '~/com/icons/baseline-add';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { preferences } from '../../globals/settings';
import { createEmptyDeck, createStarterDeck } from '../../lib/settings/onboarding';

const AddAccountDialog = lazy(() => import('../settings/AddAccountDialog'));

const brandName = import.meta.env.VITE_BRAND_NAME;

const enum Steps {
	WELCOME,
	SYNC,
	FINISH,
}

const enum StartWith {
	FRESH,
	LOCAL_BACKUP,
	ACCOUNT_BACKUP,
}

const ProgressIndicator = (props: { active: boolean }) => {
	return <div class={clsx([`h-1 w-4 rounded`, props.active ? `bg-accent` : `bg-secondary/40`])}></div>;
};

const Onboarding = () => {
	const [step, setStep] = createSignal(Steps.WELCOME);
	const [startWith, setStartWith] = createSignal(StartWith.FRESH);

	const [freshWithExample, setFreshWithExample] = createSignal(true);

	const handleFinish = () => {
		const $startWith = startWith();

		batch(() => {
			if ($startWith === StartWith.FRESH) {
				const deck = freshWithExample() ? createStarterDeck(multiagent.active!) : createEmptyDeck();
				preferences.decks.push(deck);
			}

			preferences.onboarding = false;
		});
	};

	return (
		<div class="flex h-full max-h-141 w-full max-w-md flex-col rounded-md bg-background shadow-md">
			<div class="flex min-h-0 grow flex-col overflow-y-auto p-4 pb-0">
				<div class="mb-6 flex shrink-0 justify-center gap-1">
					<ProgressIndicator active={step() === Steps.WELCOME} />
					<ProgressIndicator active={step() === Steps.SYNC} />
					<ProgressIndicator active={step() === Steps.FINISH} />
				</div>

				{(() => {
					const $step = step();

					if ($step === Steps.WELCOME) {
						return (
							<div>
								<h1 class="text-xl font-semibold">Welcome to {brandName}!</h1>
								<p class="mt-1 text-sm text-muted-fg">To begin, let's add your Bluesky account.</p>

								<div class="-mx-4 mt-4">
									<For each={multiagent.accounts}>
										{(account) => {
											return (
												<div class="flex items-center gap-4 px-4 py-3">
													<img
														src={account.profile?.avatar || DefaultUserAvatar}
														class="h-10 w-10 shrink-0 rounded-full"
													/>

													<div class="flex min-w-0 grow flex-col text-sm">
														<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
															{account.profile?.displayName}
														</p>
														<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
															{'@' + account.session.handle}
														</p>
													</div>
												</div>
											);
										}}
									</For>

									<button
										onClick={() => {
											openModal(() => <AddAccountDialog />);
										}}
										class={
											/* @once */ Interactive({
												class: `flex w-full items-center gap-3 px-4 py-3 text-left text-sm`,
											})
										}
									>
										<AddIcon class="text-lg" />
										<span>Add account</span>
									</button>
								</div>
							</div>
						);
					}

					if ($step === Steps.SYNC) {
						const model = createRadioModel(startWith, setStartWith);
						const id = getUniqueId();

						return (
							<div>
								<h1 class="text-xl font-semibold">How would you like to start?</h1>
								<p class="mt-1 text-sm text-muted-fg">
									If you have a backup of your settings, you can restore it here.
								</p>

								<div class="-mx-4 mt-4">
									<label class="block px-4 py-3">
										<div class="flex min-w-0 justify-between gap-4">
											<span class="text-sm">Start fresh</span>
											<Radio ref={model(StartWith.FRESH)} name={id} />
										</div>
										<p class="mr-6 text-de text-muted-fg">
											If you're new around here, or want a blank slate to start over.
										</p>
									</label>
									<div hidden={startWith() !== StartWith.FRESH} class="ml-4 px-4 pb-3 pt-1">
										<label class="flex items-center gap-3 pb-2">
											<Checkbox ref={modelChecked(freshWithExample, setFreshWithExample)} />
											<fieldset class="text-sm disabled:opacity-50">Start with an example deck</fieldset>
										</label>
									</div>

									<label class="block px-4 py-3">
										<div class="flex min-w-0 justify-between gap-4">
											<span class="text-sm opacity-50">
												Restore a local backup <b>(coming soon!)</b>
											</span>
											<Radio ref={model(StartWith.LOCAL_BACKUP)} name={id} disabled />
										</div>
										<p class="mr-6 text-de text-muted-fg opacity-50">
											Use a JSON file containing your saved settings.
										</p>
									</label>
									<div hidden={startWith() !== StartWith.LOCAL_BACKUP} class="ml-4 px-4 pb-3 pt-1">
										<button class={/* @once */ Button({ variant: 'outline' })}>
											<AddIcon class="-ml-1.5 mr-2 text-lg" />
											<span>Select file</span>
										</button>
									</div>
								</div>
							</div>
						);
					}

					if ($step === Steps.FINISH) {
						return (
							<div class="flex min-h-0 grow flex-col">
								<h1 class="text-xl font-semibold">You're all set!</h1>
								<p class="mt-1 text-sm text-muted-fg">
									Thanks for trying out {brandName}, we hope you'll like it.
								</p>

								<p class="mt-2 text-sm text-muted-fg">
									If you enjoyed it, try{' '}
									<a href="https://mary.my.id/donate" target="_bank" class="text-accent hover:underline">
										donating
									</a>
									!
								</p>
							</div>
						);
					}
				})()}
			</div>
			<div class="flex shrink-0 items-center gap-2 p-4">
				<a
					target="_blank"
					href="https://mary.my.id/langit/privacy"
					class="ml-2 text-de text-muted-fg hover:underline"
				>
					Privacy
				</a>

				<div class="grow"></div>

				<button
					hidden={(() => {
						const $step = step();
						return !($step === Steps.SYNC || $step === Steps.FINISH);
					})()}
					onClick={() => {
						const $step = step();

						if ($step === Steps.SYNC) {
							setStep(Steps.WELCOME);
						} else if ($step === Steps.FINISH) {
							setStep(Steps.SYNC);
						}
					}}
					class={/* @once */ Button({ variant: 'outline' })}
				>
					<ChevronRightIcon class="-mx-2 rotate-180 text-lg" />
				</button>

				<button
					disabled={(() => {
						const $step = step();
						return (
							($step === Steps.WELCOME && multiagent.accounts.length < 1) ||
							($step === Steps.SYNC && startWith() !== StartWith.FRESH)
						);
					})()}
					onClick={() => {
						const $step = step();

						if ($step === Steps.WELCOME) {
							setStep(Steps.SYNC);
						} else if ($step === Steps.SYNC) {
							setStep(Steps.FINISH);
						} else if ($step === Steps.FINISH) {
							handleFinish();
						}
					}}
					class={/* @once */ Button({ variant: 'primary' })}
				>
					{(() => {
						const $step = step();

						if ($step === Steps.SYNC) {
							return `Next`;
						} else if ($step === Steps.FINISH) {
							return `Let's go!`;
						}

						return `Next`;
					})()}
				</button>
			</div>
		</div>
	);
};

export default Onboarding;
