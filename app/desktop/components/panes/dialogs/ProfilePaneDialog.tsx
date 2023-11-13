import { Match, Switch } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import ProfileHeader from '~/com/components/views/ProfileHeader.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfilePaneDialogProps {
	/** Expected to be static */
	actor: DID;
}

const ProfilePaneDialog = (props: ProfilePaneDialogProps) => {
	const { actor } = props;

	const { pane } = usePaneContext();

	const profile = createQuery(() => {
		const key = getProfileKey(pane.uid, actor);

		return {
			queryKey: key,
			queryFn: getProfile,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialProfile(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $profile = profile.data;

					if ($profile) {
						return $profile.displayName.value || `@${$profile.handle.value}`;
					}

					return `Profile`;
				})()}
				subtitle={(() => {
					const $profile = profile.data;

					if ($profile) {
						return `${$profile.postsCount.value} posts`;
					}

					return;
				})()}
			/>

			<Switch>
				<Match when={profile.data} keyed>
					{(data) => {
						return (
							<>
								<VirtualContainer>
									<ProfileHeader uid={pane.uid} profile={data} />
								</VirtualContainer>
							</>
						);
					}}
				</Match>

				<Match when={profile.isLoading}>
					<div class="grid h-13 place-items-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</PaneDialog>
	);
};

export default ProfilePaneDialog;
