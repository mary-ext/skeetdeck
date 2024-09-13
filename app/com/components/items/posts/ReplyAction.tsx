import { makeEventListener } from '@solid-primitives/event-listener';
import { type JSX, untrack } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts';
import { getRecordId } from '~/api/utils/misc';

import { assert } from '~/utils/misc';

import { Button } from '../../../primitives/button';
import { Flyout, offsetlessMiddlewares } from '../../Flyout';
import { LINK_REPLY, useLinking } from '../../Link';

export interface ReplyActionProps {
	post: SignalizedPost;
	hideRoot?: boolean;
	children: (disabled: boolean) => JSX.Element;
}

const ReplyAction = (props: ReplyActionProps) => {
	const linking = useLinking();

	return (() => {
		const post = props.post;
		const disabled = post.viewer.replyDisabled.value ?? false;

		const button = untrack(() => props.children(disabled));
		assert(button instanceof HTMLElement);

		if (disabled) {
			return (
				<Flyout button={button} placement="bottom" middleware={offsetlessMiddlewares}>
					{({ close, menuProps }) => {
						// @todo: show threadgate rules here.

						return (
							<div
								{...menuProps}
								class="flex flex-col gap-4 overflow-hidden overflow-y-auto rounded-lg bg-background p-4 shadow-menu"
							>
								<h1 class="text-lg font-bold">You can't reply</h1>

								<p class="max-w-sm text-sm">The thread author has limited who can reply to the thread.</p>

								<div class="flex justify-end">
									<button onClick={close} class={/* @once */ Button({ variant: 'outline' })}>
										Got it
									</button>
								</div>
							</div>
						);
					}}
				</Flyout>
			);
		}

		makeEventListener(button, 'click', () => {
			linking.navigate({ type: LINK_REPLY, actor: post.author.did, rkey: getRecordId(post.uri) });
		});

		return button;
	}) as unknown as JSX.Element;
};

export default ReplyAction;
