import { updateProfileFollow } from '~/api/mutations/follow-profile';
import type { SignalizedProfile } from '~/api/stores/profiles';

import { openModal } from '../globals/modals';
import { Button } from '../primitives/button';

import ConfirmDialog from './dialogs/ConfirmDialog';

export interface ProfileFollowButtonProps {
	profile: SignalizedProfile;
	grow?: boolean;
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
			class={Button({
				variant: isBlocked() ? 'danger' : isFollowing() ? 'outline' : 'primary',
				grow: props.grow,
			})}
		>
			{isBlocked() ? 'Blocked' : isFollowing() ? 'Following' : 'Follow'}
		</button>
	);
};

export default ProfileFollowButton;
