import { createQuery } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent';
import type { MultiagentAccountData } from '~/api/classes/multiagent';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';
import type { SignalizedProfile } from '~/api/stores/profiles';

import { formatCompact } from '~/utils/intl/number';

import { Interactive } from '~/com/primitives/interactive';

import BackHandOutlinedIcon from '~/com/icons/outline-back-hand';
import ListBoxOutlinedIcon from '~/com/icons/outline-list-box';
import PersonOutlinedIcon from '~/com/icons/outline-person';
import SettingsOutlinedIcon from '~/com/icons/outline-settings';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

const navItem = Interactive({ class: 'flex min-w-0 items-center gap-4 px-4 py-3 text-lg font-medium' });

const NavDrawer = (props: {
	account: MultiagentAccountData | undefined;
	profile: SignalizedProfile | undefined;
	onClose: () => void;
}) => {
	const close = props.onClose;

	return (
		<div class="overlay-y-auto pointer-events-none flex h-full w-full overflow-y-auto bg-black/50 dark:bg-hinted/50">
			<div class="pointer-events-auto flex w-full max-w-72 flex-col overflow-y-auto bg-background shadow-md">
				{(() => {
					const account = props.account;

					if (account) {
						const href = `/${account.did}`;

						return (
							<div class="contents">
								<div class="flex flex-col p-4">
									<div class="flex min-w-0">
										<div class="h-10 w-10 overflow-hidden rounded-full">
											{(() => {
												const avatar = account.profile?.avatar;
												return <img src={avatar || DefaultUserAvatar} class="h-full w-full object-cover" />;
											})()}
										</div>
									</div>

									<div class="mt-2 block">
										<p dir="auto" class="overflow-hidden break-words text-lg font-bold empty:hidden">
											{account.profile?.displayName}
										</p>
										<p class="overflow-hidden break-words text-sm text-muted-fg">
											{`@${account.session.handle}`}
										</p>
									</div>

									<div class="mt-3 flex min-w-0 flex-wrap gap-4 text-sm">
										<a href={href + `/follows`} onClick={close}>
											<span class="font-bold">
												{(() => {
													const profile = props.profile;
													return formatCompact(profile ? profile.followsCount.value : 0);
												})()}
											</span>{' '}
											<span class="text-muted-fg">Follows</span>
										</a>

										<a href={href + `/followers`} onClick={close}>
											<span class="font-bold">
												{(() => {
													const profile = props.profile;
													return formatCompact(profile ? profile.followersCount.value : 0);
												})()}
											</span>{' '}
											<span class="text-muted-fg">Followers</span>
										</a>
									</div>
								</div>

								<a href={href} onClick={close} class={navItem}>
									<PersonOutlinedIcon class="text-2xl" />
									<span>Profile</span>
								</a>

								<a href="/lists" onClick={close} class={navItem}>
									<ListBoxOutlinedIcon class="text-2xl" />
									<span>Lists</span>
								</a>

								<a href="/settings/moderation" onClick={close} class={navItem}>
									<BackHandOutlinedIcon class="text-2xl" />
									<span>Moderation</span>
								</a>

								<a href="/settings" onClick={close} class={navItem}>
									<SettingsOutlinedIcon class="text-2xl" />
									<span>Settings</span>
								</a>
							</div>
						);
					}
				})()}
			</div>
		</div>
	);
};

export default NavDrawer;
