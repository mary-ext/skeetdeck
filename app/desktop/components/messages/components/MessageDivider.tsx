import { formatAbsDate } from '~/utils/intl/time';

export interface MessageDividerProps {
	/** Expected to be static */
	date: string;
}

const MessageDivider = ({ date }: MessageDividerProps) => {
	return (
		<div class="mx-3 mb-6 flex h-0 items-center justify-center border-b border-divider">
			<span class="bg-background px-3 text-xs font-medium text-muted-fg">
				{/* @once */ formatAbsDate(date)}
			</span>
		</div>
	);
};

export default MessageDivider;
