import type { JSX } from 'solid-js';

import type { DID } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { clsx } from '~/utils/misc';

import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import CheckIcon from '~/com/icons/baseline-check';

export interface SwitchAccountActionProps {
	value?: DID | undefined;
	onChange: (next: DID) => void;
	children: JSX.Element;
}

const SwitchAccountAction = (props: SwitchAccountActionProps) => {
	return (
		<Flyout button={props.children} middleware={offsetlessMiddlewares} placement="bottom">
			{({ close, menuProps }) => (
				<div {...menuProps} class={/* @once */ MenuRoot()}>
					{multiagent.accounts.map((account) => (
						<button
							onClick={() => {
								close();
								props.onChange(account.did);
							}}
							class={/* @once */ MenuItem()}
						>
							<img
								src={account.profile?.avatar || DefaultUserAvatar}
								class="h-10 w-10 shrink-0 rounded-full"
							/>

							<div class="min-w-0 grow text-sm">
								<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
									{account.profile?.displayName}
								</p>
								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
									{'@' + account.session.handle}
								</p>
							</div>

							<CheckIcon class={clsx([`text-xl text-accent`, account.did !== props.value && `invisible`])} />
						</button>
					))}
				</div>
			)}
		</Flyout>
	);
};

export default SwitchAccountAction;
