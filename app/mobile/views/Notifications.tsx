import { IconButton } from '~/com/primitives/icon-button';

import CheckAllIcon from '~/com/icons/baseline-check-all';

import ViewHeader from '../components/ViewHeader';

const NotificationsView = () => {
	return (
		<div class="contents">
			<ViewHeader main title="Notifications">
				<button title="Mark all as read" class={/* @once */ IconButton()}>
					<CheckAllIcon />
				</button>
			</ViewHeader>
		</div>
	);
};

export default NotificationsView;
