import { getAccountData, multiagent } from '~/api/globals/agent';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import { Interactive } from '~/com/primitives/interactive';

import { useNavDrawer } from './NavDrawerContext';

const drawerBtn = Interactive({
	variant: 'none',
	class: `mr-2 grid h-8 w-8 place-items-center rounded-full outline-primary hover:opacity-50`,
});

const NavDrawerButton = () => {
	const { open } = useNavDrawer();

	return (
		<button title="Open navigation drawer" onClick={open} class={drawerBtn}>
			{(() => {
				const account = getAccountData(multiagent.active);
				const avatar = account?.profile?.avatar;

				return <img src={avatar || DefaultUserAvatar} class="h-6 w-6 rounded-full object-cover" />;
			})()}
		</button>
	);
};

export default NavDrawerButton;
