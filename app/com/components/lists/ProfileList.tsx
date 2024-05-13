import type { CreateInfiniteQueryResult, InfiniteData } from '@mary/solid-query';

import type { SignalizedProfile } from '~/api/stores/profiles';

import List from '../List';
import { VirtualContainer } from '../VirtualContainer';

import { ProfileItem, type ProfileItemAccessory, type ProfileItemProps } from '../items/ProfileItem';

export interface ProfileListProps {
	/** Expected to be static */
	query: CreateInfiniteQueryResult<InfiniteData<{ profiles: SignalizedProfile[] }>>;
	/** Expected to be static */
	asideAccessory?: ProfileItemAccessory;
	onItemClick?: ProfileItemProps['onClick'];
}

const ProfileList = (props: ProfileListProps) => {
	const query = props.query;
	const aside = props.asideAccessory;

	return (
		<List
			data={query.data?.pages.flatMap((page) => page.profiles)}
			render={(profile) => {
				return (
					<VirtualContainer class="shrink-0" estimateHeight={88}>
						<ProfileItem profile={profile} aside={aside} onClick={props.onItemClick} />
					</VirtualContainer>
				);
			}}
			hasNextPage={query.hasNextPage}
			isFetchingNextPage={query.isFetching}
			onEndReached={() => query.fetchNextPage()}
		/>
	);
};

export default ProfileList;
