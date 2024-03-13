import type { Component, ComponentProps, JSX } from 'solid-js';

import type { AppBskyFeedThreadgate, Brand } from '~/api/atp-schema';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import AccountCheckIcon from '~/com/icons/baseline-account-check';
import AlternateEmailIcon from '~/com/icons/baseline-alternate-email';
import CheckIcon from '~/com/icons/baseline-check';
// import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import PublicIcon from '~/com/icons/baseline-public';
import LockIcon from '~/com/icons/baseline-lock';

import type { GateState } from '../ComposerContext';

type Rule = Brand.Union<
	AppBskyFeedThreadgate.FollowingRule | AppBskyFeedThreadgate.ListRule | AppBskyFeedThreadgate.MentionRule
>;

export interface ThreadgateActionProps {
	state: GateState;
	onChange: (next: GateState) => void;
	children: JSX.Element;
}

type IconComponent = Component<ComponentProps<'svg'>>;

const ThreadgateAction = (props: ThreadgateActionProps) => {
	const onChange = props.onChange;

	return (
		<Flyout button={props.children} placement="bottom" middleware={offsetlessMiddlewares}>
			{({ close, menuProps }) => {
				const current = props.state;

				const item = (value: GateState['type'], Icon: IconComponent, name: string) => {
					return (
						<button
							onClick={() => {
								close();

								if (value === 'c') {
								} else {
									onChange({ type: value });
								}
							}}
							class={/* @once */ MenuItem()}
						>
							<Icon class={/* @once */ MenuItemIcon()} />
							<span class="grow">{name}</span>

							<CheckIcon
								class={/* @once */ 'text-base text-accent' + (current.type !== value ? ' invisible' : '')}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="px-3 py-2 text-sm">
							<p class="font-bold">Who can reply?</p>
							<p class="text-de text-muted-fg">Choose who can reply to this post.</p>
						</div>

						{/* @once */ item('e', PublicIcon, `Everyone`)}
						{/* @once */ item('m', AlternateEmailIcon, `Mentioned users only`)}
						{/* @once */ item('f', AccountCheckIcon, `Followed users only`)}

						{/* @todo: get around to doing this later. */}
						{/* {item('c', MoreHorizIcon, `Custom`)} */}
					</div>
				);
			}}
		</Flyout>
	);
};

export default ThreadgateAction;

export const buildGateRules = (state: GateState): Rule[] | undefined => {
	const type = state.type;

	if (type === 'm') {
		return [{ $type: 'app.bsky.feed.threadgate#mentionRule' }];
	} else if (type === 'f') {
		return [{ $type: 'app.bsky.feed.threadgate#followingRule' }];
	} else if (type === 'c') {
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
};

export const renderGateIcon = (state: GateState): JSX.Element => {
	const type = state.type;

	let Icon: IconComponent = PublicIcon;

	if (type === 'e') {
		Icon = PublicIcon;
	} else if (type === 'f') {
		Icon = AccountCheckIcon;
	} else if (type === 'm') {
		Icon = AlternateEmailIcon;
	} else {
		Icon = LockIcon;
	}

	return <Icon />;
};

export const renderGateAlt = (state: GateState): string => {
	const type = state.type;

	let msg: string;

	if (type === 'e') {
		msg = `Everyone can reply to your post.`;
	} else if (type === 'f') {
		msg = `Only followed users can reply.`;
	} else if (type === 'm') {
		msg = `Only mentioned users can reply.`;
	} else {
		msg = `Custom reply limits are set.`;
	}

	return msg + `\nClick here to change...`;
};
