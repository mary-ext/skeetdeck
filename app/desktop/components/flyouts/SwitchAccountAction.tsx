import type { JSX } from 'solid-js';

import { flip, shift } from '@floating-ui/dom';

import type { DID } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';

import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout } from '~/com/components/Flyout.tsx';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import CheckIcon from '~/com/icons/baseline-check.tsx';

export interface SwitchAccountActionProps {
	value?: DID | undefined;
	onChange: (next: DID) => void;
	children: JSX.Element;
}

const SwitchAccountAction = (props: SwitchAccountActionProps) => {
	return (
		<Flyout button={props.children} middleware={[shift({ padding: 16 }), flip()]} placement="bottom">
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

							<CheckIcon
								class="text-xl text-accent"
								classList={{ [`invisible`]: account.did !== props.value }}
							/>
						</button>
					))}
				</div>
			)}
		</Flyout>
	);
};

export default SwitchAccountAction;
