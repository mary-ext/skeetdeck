import type { DID } from '~/api/atp-schema.ts';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { Button } from '../primitives/button.ts';

export interface ProfileFollowButtonProps {
	uid: DID;
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

				if (isFollowing()) {
				} else {
				}
			}}
			class={Button({ variant: isBlocked() ? 'danger' : isFollowing() ? 'outline' : 'primary' })}
		>
			{isBlocked() ? 'Blocked' : isFollowing() ? 'Following' : 'Follow'}
		</button>
	);
};

export default ProfileFollowButton;
