import type { Component, ComponentProps, JSX } from 'solid-js';

import type { AtUri, UnionOf } from '~/api/atp-schema.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout.tsx';

import AccountCheckIcon from '~/com/icons/baseline-account-check.tsx';
import AlternateEmailIcon from '~/com/icons/baseline-alternate-email.tsx';
import CheckIcon from '~/com/icons/baseline-check.tsx';
// import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';
import PublicIcon from '~/com/icons/baseline-public.tsx';
import LockIcon from '~/com/icons/baseline-lock.tsx';

type Rule =
	| UnionOf<'app.bsky.feed.threadgate#followingRule'>
	| UnionOf<'app.bsky.feed.threadgate#listRule'>
	| UnionOf<'app.bsky.feed.threadgate#mentionRule'>;

const enum GateType {
	EVERYONE,
	MENTIONED_ONLY,
	FOLLOWED_ONLY,
	CUSTOM,
}

export type GateState =
	| { type: GateType.EVERYONE }
	| { type: GateType.MENTIONED_ONLY }
	| { type: GateType.FOLLOWED_ONLY }
	| { type: GateType.CUSTOM; mentions: boolean; follows: boolean; lists: AtUri[] };

export interface ThreadgateActionProps {
	state: GateState | undefined;
	onChange: (next: GateState | undefined) => void;
	children: JSX.Element;
}

type IconComponent = Component<ComponentProps<'svg'>>;

const ThreadgateAction = (props: ThreadgateActionProps) => {
	const onChange = props.onChange;

	return (
		<Flyout button={props.children} placement="bottom" middleware={offsetlessMiddlewares}>
			{({ close, menuProps }) => {
				const current = props.state ?? { type: GateType.EVERYONE };

				const item = (value: GateType, Icon: IconComponent, name: string) => {
					return (
						<button
							onClick={() => {
								close();

								if (value === GateType.CUSTOM) {
								} else if (value === GateType.EVERYONE) {
									onChange(undefined);
								} else {
									onChange({ type: value });
								}
							}}
							class={/* @once */ MenuItem()}
						>
							<Icon class={/* @once */ MenuItemIcon()} />
							<span class="grow">{name}</span>

							<CheckIcon
								class={/* @once */ 'text-xl text-accent' + (current.type !== value ? ' invisible' : '')}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="p-4 text-sm">
							<p class="font-bold">Who can reply?</p>
							<p class="text-muted-fg">Choose who can reply to this post.</p>
						</div>

						{/* @once */ item(GateType.EVERYONE, PublicIcon, `Everyone`)}
						{/* @once */ item(GateType.MENTIONED_ONLY, AlternateEmailIcon, `Mentioned users only`)}
						{/* @once */ item(GateType.FOLLOWED_ONLY, AccountCheckIcon, `Followed users only`)}

						{/* @todo: get around to doing this later. */}
						{/* {item(GateType.CUSTOM, MoreHorizIcon, `Custom`)} */}
					</div>
				);
			}}
		</Flyout>
	);
};

export default ThreadgateAction;

export const buildGateRules = (state: GateState | undefined): Rule[] | undefined => {
	if (state) {
		const type = state.type;

		if (type === GateType.MENTIONED_ONLY) {
			return [{ $type: 'app.bsky.feed.threadgate#mentionRule' }];
		} else if (type === GateType.FOLLOWED_ONLY) {
			return [{ $type: 'app.bsky.feed.threadgate#followingRule' }];
		} else if (type === GateType.CUSTOM) {
			const rules: Rule[] = [];
			const lists = state.lists;

			if (state.mentions) {
				rules.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
			}
			if (state.follows) {
				rules.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
			}

			for (let i = 0, ilen = lists.length; i < ilen; i++) {
				const uri = lists[i];
				rules.push({ $type: 'app.bsky.feed.threadgate#listRule', list: uri });
			}

			return rules;
		}
	}
};

export const renderGateIcon = (state: GateState | undefined): JSX.Element => {
	let Icon: IconComponent = PublicIcon;

	if (state) {
		const type = state.type;

		if (type === GateType.FOLLOWED_ONLY) {
			Icon = AccountCheckIcon;
		} else if (type === GateType.MENTIONED_ONLY) {
			Icon = AlternateEmailIcon;
		} else if (type === GateType.CUSTOM) {
			Icon = LockIcon;
		}
	}

	return <Icon />;
};

export const renderGateAlt = (state: GateState | undefined): string => {
	let msg = `Everyone can reply to your post.`;

	if (state) {
		const type = state.type;

		if (type === GateType.FOLLOWED_ONLY) {
			msg = `Only followed users can reply.`;
		} else if (type === GateType.MENTIONED_ONLY) {
			msg = `Only mentioned users can reply.`;
		} else if (type === GateType.CUSTOM) {
			msg = `Custom reply limits are set.`;
		}
	}

	return msg + `\nClick here to change...`;
};
