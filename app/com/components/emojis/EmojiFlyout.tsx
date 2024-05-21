import { Suspense, lazy, type JSX } from 'solid-js';

import { type Placement } from '@floating-ui/dom';

import CircularProgress from '../CircularProgress';
import { Flyout, offsetlessMiddlewares } from '../Flyout';

import type { PickedEmoji } from './utils/database';

const EmojiPicker = lazy(() => import('./EmojiPicker'));

export interface EmojiFlyoutProps {
	children: JSX.Element;
	multiple?: boolean;
	placement?: Placement;
	onPick: (emoji: PickedEmoji, shift: boolean) => void;
}

const EmojiFlyout = (props: EmojiFlyoutProps) => {
	return (
		<Flyout
			button={props.children}
			middleware={offsetlessMiddlewares}
			placement={props.placement ?? 'bottom-start'}
		>
			{({ close, menuProps }) => (
				<div {...menuProps} class="overflow-hidden rounded-lg bg-background shadow-menu">
					<Suspense
						fallback={
							<div class="grid place-items-center" style="height: 397.08px;width: 340px">
								<CircularProgress />
							</div>
						}
					>
						<EmojiPicker
							multiple={props.multiple}
							onPick={(emoji, shouldClose) => {
								if (shouldClose) {
									close();
								}

								props.onPick(emoji, shouldClose);
							}}
						/>
					</Suspense>
				</div>
			)}
		</Flyout>
	);
};

export default EmojiFlyout;
