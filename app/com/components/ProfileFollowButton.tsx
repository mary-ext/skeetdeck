import { updateProfileFollow } from '~/api/mutations/follow-profile.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { openModal } from '../globals/modals.tsx';

import { Button } from '../primitives/button.ts';

import ConfirmDialog from './dialogs/ConfirmDialog.tsx';

export interface ProfileFollowButtonProps {
	profile: SignalizedProfile;
}

// TODO: differentiate blockedBy and blocking
const ProfileFollowButton = (props: ProfileFollowButtonProps) => {
	const profile = () => props.profile;

	const isFollowing = () => profile().viewer.following.value;

	const isBlocked = () => {
		const $viewer = profile().viewer;
		return $viewer.blockedBy.value || !!$viewer.blocking.value;
	};

	return (
		<button
			onClick={() => {
				if (isBlocked()) {
					return;
				}

				const $profile = profile();

				if (isFollowing()) {
					openModal(() => (
						<ConfirmDialog
							title={`Unfollow @${$profile.handle.value}?`}
							body={`Their posts will no longer show up in your home timeline`}
							confirmation={`Unfollow`}
							onConfirm={() => updateProfileFollow($profile, false)}
						/>
					));
				} else {
					updateProfileFollow($profile, true);
				}
			}}
			class={Button({ variant: isBlocked() ? 'danger' : isFollowing() ? 'outline' : 'primary' })}
		>
			{isBlocked() ? 'Blocked' : isFollowing() ? 'Following' : 'Follow'}
		</button>
	);
};

export default ProfileFollowButton;
