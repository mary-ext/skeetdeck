import { IconButton } from '~/com/primitives/icon-button';

import SearchIcon from '~/com/icons/baseline-search';

import ViewHeader from '../components/ViewHeader';

const ExploreView = () => {
	return (
		<div class="contents">
			<ViewHeader main title="Explore">
				<a title="Search Bluesky..." href="/search" class={/* @once */ IconButton()}>
					<SearchIcon />
				</a>
			</ViewHeader>
		</div>
	);
};

export default ExploreView;
