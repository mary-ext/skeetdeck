import { lazy, type JSX } from 'solid-js';

import type { ChatBskyConvoDefs } from '~/api/atp-schema';
import { serializeRichText } from '~/api/richtext/utils';

import { openModal } from '~/com/globals/modals';

import { Flyout } from '~/com/components/Flyout';
import ContentCopyIcon from '~/com/icons/baseline-content-copy';
import DeleteIcon from '~/com/icons/baseline-delete';
import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { useChannel } from '../contexts/channel';

const ConfirmDialog = lazy(() => import('~/com/components/dialogs/ConfirmDialog'));

export interface MessageOverflowActionProps {
	/** Expected to be static */
	item: ChatBskyConvoDefs.MessageView;
	children: JSX.Element;
}

const MessageOverflowAction = (props: MessageOverflowActionProps) => {
	const { channel } = useChannel();

	const item = props.item;

	return (
		<Flyout button={props.children} placement="bottom-end">
			{({ close, menuProps }) => (
				<div {...menuProps} class={/* @once */ MenuRoot()}>
					<button
						onClick={() => {
							close();

							const serialized = serializeRichText(item.text, item.facets, true);

							navigator.clipboard.writeText(serialized);
						}}
						class={/* @once */ MenuItem()}
					>
						<ContentCopyIcon class={/* @once */ MenuItemIcon()} />
						<span>Copy message text</span>
					</button>

					<button
						onClick={() => {
							close();

							openModal(() => (
								<ConfirmDialog
									title="Delete this message?"
									body="The message will be deleted for you, but not to other participants."
									confirmation="Delete"
									onConfirm={() => channel.deleteMessage(item.id)}
								/>
							));
						}}
						class={/* @once */ MenuItem()}
					>
						<DeleteIcon class={/* @once */ MenuItemIcon()} />
						<span>Delete for me</span>
					</button>
				</div>
			)}
		</Flyout>
	);
};

export default MessageOverflowAction;
