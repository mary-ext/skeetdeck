import { formatAbsDate } from '~/utils/intl/time';

export interface MessageDividerProps {
	/** Expected to be static */
	date: string;
	/** Expected to be static */
	unread?: boolean;
}

const MessageDivider = ({ date, unread }: MessageDividerProps) => {
	return (
		<div
			class={
				`mx-3 mb-6 flex h-0 items-center justify-center border-b` +
				(!unread ? ` border-divider text-muted-fg` : ` border-red-600 text-red-600`)
			}
		>
			<span class="bg-background px-3 text-xs font-medium">
				{/* @once */ !unread ? formatAbsDate(date) : `NEW`}
			</span>
		</div>
	);
};

export default MessageDivider;
