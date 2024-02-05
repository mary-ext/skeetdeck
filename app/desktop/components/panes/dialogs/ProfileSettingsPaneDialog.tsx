import { createMemo, createSignal as signal } from 'solid-js';

import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';
import { createMutation, useQueryClient } from '@pkg/solid-query';

import TextareaAutosize from 'solid-textarea-autosize';

import type { Records, UnionOf } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getProfileKey } from '~/api/queries/get-profile.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { EOF_WS_RE } from '~/api/richtext/composer.ts';
import { graphemeLen } from '~/api/richtext/intl.ts';

import { formatLong } from '~/utils/intl/number.ts';
import { model } from '~/utils/input.ts';
import { mapDefined } from '~/utils/misc.ts';

import { Button } from '~/com/primitives/button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Textarea } from '~/com/primitives/textarea.ts';

import AddPhotoButton from '~/com/components/inputs/AddPhotoButton.tsx';
import Checkbox from '~/com/components/inputs/Checkbox.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';

import { usePaneModalState } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfileSettingsPaneDialogProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const MAX_DESC_LENGTH = 300;

const NoUnauthenticatedLabel = '!no-unauthenticated';

const profileRecordType = 'app.bsky.actor.profile';

type ProfileRecord = Records[typeof profileRecordType];

const ProfileSettingsPaneDialog = (props: ProfileSettingsPaneDialogProps) => {
	const queryClient = useQueryClient();

	const { disableBackdropClose, close } = usePaneModalState();

	const prof = props.profile;

	const [avatar, setAvatar] = signal<Blob | string | undefined>(prof.avatar.value || undefined);
	const [banner, setBanner] = signal<Blob | string | undefined>(prof.banner.value || undefined);
	const [name, setName] = signal(prof.displayName.value || '');
	const [desc, setDesc] = signal(prof.description.value || '');

	const actualDesc = createMemo(() => desc().replace(EOF_WS_RE, ''));
	const length = createMemo(() => graphemeLen(actualDesc()));

	const [labels, setLabels] = signal(
		mapDefined(prof.labels.value, (x) => (x.src === prof.did ? x.val : undefined)),
	);

	const profileMutation = createMutation(() => ({
		mutationFn: async () => {
			let prev: ProfileRecord | undefined;
			let swap: string | undefined;

			const uid = prof.uid;

			const $avatar = avatar();
			const $banner = banner();
			const $name = name();
			const $description = actualDesc();
			const $labels = labels();

			const agent = await multiagent.connect(uid);

			// 1. Retrieve the actual record to replace
			try {
				const response = await agent.rpc.get('com.atproto.repo.getRecord', {
					params: {
						repo: uid,
						collection: profileRecordType,
						rkey: 'self',
					},
				});

				const data = response.data;

				prev = data.value as any;
				swap = data.cid;
			} catch (err) {
				// If it's anything else than an InvalidRequest (not found), throw an error

				if (!(err instanceof XRPCError) || err.error !== 'InvalidRequest') {
					throw err;
				}
			}

			// 2. Merge our changes
			{
				const nextAvatar =
					$avatar === undefined
						? undefined
						: $avatar instanceof Blob
							? await uploadBlob<any>(uid, $avatar)
							: prev?.avatar;

				const nextBanner =
					$banner === undefined
						? undefined
						: $banner instanceof Blob
							? await uploadBlob<any>(uid, $banner)
							: prev?.banner;

				const nextLabels: UnionOf<'com.atproto.label.defs#selfLabels'> | undefined =
					$labels.length > 0
						? { $type: 'com.atproto.label.defs#selfLabels', values: $labels.map((val) => ({ val: val })) }
						: undefined;

				let record: ProfileRecord | undefined = prev;

				if (record) {
					record.avatar = nextAvatar;
					record.banner = nextBanner;
					record.displayName = $name;
					record.description = $description;
					record.labels = nextLabels;
				} else {
					record = {
						avatar: nextAvatar,
						banner: nextBanner,
						displayName: $name,
						description: $description,
						labels: nextLabels,
					};
				}

				await agent.rpc.call('com.atproto.repo.putRecord', {
					data: {
						repo: uid,
						collection: profileRecordType,
						rkey: 'self',
						swapRecord: swap,
						record: record,
					},
				});

				await Promise.allSettled([
					queryClient.invalidateQueries({ queryKey: getProfileKey(prof.uid, prof.did) }),
					// this should be impossible, as we don't allow arbitrary routing
					// queryClient.invalidateQueries({ queryKey: getProfileKey(prof.uid, prof.handle.value) }),
				]);
			}
		},
		onSuccess: () => {
			close();
		},
	}));

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		profileMutation.mutate();
	};

	return (
		<PaneDialog>
			<form onSubmit={handleSubmit} class="contents">
				<PaneDialogHeader
					title="Edit profile"
					disabled={(disableBackdropClose.value = profileMutation.isPending)}
				>
					<button
						type="submit"
						disabled={length() > MAX_DESC_LENGTH}
						class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
					>
						Save
					</button>
				</PaneDialogHeader>

				{(() => {
					const error = false;

					if (error) {
						return (
							<div title={'' + error} class="shrink-0 bg-red-500 px-4 py-3 text-sm text-white">
								Something went wrong, try again later.
							</div>
						);
					}
				})()}

				<fieldset disabled={profileMutation.isPending} class="flex min-h-0 grow flex-col overflow-y-auto">
					<div class="relative mb-4 aspect-banner w-full bg-muted-fg">
						{(() => {
							const $banner = banner();

							if ($banner) {
								return <BlobImage src={$banner} class="h-full w-full object-cover" />;
							}
						})()}

						<AddPhotoButton
							exists={!!banner()}
							title="Add banner image"
							maxWidth={3000}
							maxHeight={1000}
							onPick={setBanner}
						/>
					</div>

					<div class="relative mx-4 -mt-11 aspect-square h-20 w-20 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline">
						{(() => {
							const $avatar = avatar();

							if ($avatar) {
								return <BlobImage src={$avatar} class="h-full w-full object-cover" />;
							}
						})()}

						<AddPhotoButton
							exists={!!avatar()}
							title="Add avatar image"
							maxWidth={1000}
							maxHeight={1000}
							onPick={setAvatar}
						/>
					</div>

					<label class="mx-4 mt-4 block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
					</label>

					<label class="mx-4 mt-4 block">
						<span class="mb-2 flex items-center justify-between gap-2 text-sm font-medium leading-6 text-primary">
							<span>Description</span>
							<span
								class={
									'text-xs' +
									(length() > MAX_DESC_LENGTH ? ' font-bold text-red-500' : ' font-normal text-muted-fg')
								}
							>
								{formatLong(length())}/{/* @once */ formatLong(MAX_DESC_LENGTH)}
							</span>
						</span>

						<TextareaAutosize
							value={desc()}
							onInput={(ev) => setDesc(ev.target.value)}
							minRows={4}
							class={/* @once */ Textarea()}
						/>
					</label>

					<hr class="mt-4 border-divider" />

					<div class="px-4 py-3">
						<label class="flex min-w-0 justify-between gap-4">
							<span class="text-sm">Request limited visibility of my account</span>

							<Checkbox
								checked={labels().includes(NoUnauthenticatedLabel)}
								onChange={(ev) => {
									const next = ev.target.checked;
									const array = labels();

									if (next) {
										setLabels(array.concat(NoUnauthenticatedLabel));
									} else {
										setLabels(removeItem(array, NoUnauthenticatedLabel));
									}
								}}
							/>
						</label>

						<p class="mr-8 text-de text-muted-fg">
							This option tells every app, including Bluesky app, that you don't want your account to be seen
							by users who aren't currently signed in to an account.
						</p>

						<p class="mr-8 mt-1 text-de font-bold text-muted-fg">
							Honoring this request is voluntary — your profile and data will remain publicly available, and
							some apps may show your account regardless.
						</p>
					</div>
				</fieldset>
			</form>
		</PaneDialog>
	);
};

export default ProfileSettingsPaneDialog;

const removeItem = <T,>(array: T[], item: T): T[] => {
	const index = array.indexOf(item);

	if (index !== -1) {
		return array.toSpliced(index, 1);
	}

	return array;
};
