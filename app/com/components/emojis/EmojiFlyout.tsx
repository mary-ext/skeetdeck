import { type JSX, Suspense, lazy } from 'solid-js';

import { autoPlacement, shift } from '@floating-ui/dom';

import CircularProgress from '../CircularProgress.tsx';
import { Flyout } from '../Flyout.tsx';

import type { PickedEmoji } from './utils/database.ts';

const EmojiPicker = lazy(() => import('./EmojiPicker.tsx'));

export interface EmojiFlyoutProps {
	children: JSX.Element;
	multiple?: boolean;
	onPick: (emoji: PickedEmoji, shift: boolean) => void;
}

const EmojiFlyout = (props: EmojiFlyoutProps) => {
	return (
		<Flyout
			button={props.children}
			middleware={[autoPlacement(), shift({ padding: 16 })]}
			placement="bottom-start"
		>
			{({ close, menuProps }) => (
				<div {...menuProps} class="overflow-hidden rounded-lg bg-background shadow-menu">
					<Suspense
						fallback={
							<div class="grid place-items-center" style="height: 348.8px;width: 324px">
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
