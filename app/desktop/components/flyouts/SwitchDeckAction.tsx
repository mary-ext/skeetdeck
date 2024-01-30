import type { JSX } from 'solid-js';

import { clsx } from '~/utils/misc.ts';

import type { DeckConfig } from '../../globals/panes.ts';
import { preferences } from '../../globals/settings.ts';

import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout.tsx';

import CheckIcon from '~/com/icons/baseline-check.tsx';

export interface SwitchDeckActionProps {
	value?: string;
	onChange: (next: DeckConfig) => void;
	children: JSX.Element;
}

const SwitchDeckAction = (props: SwitchDeckActionProps) => {
	return (
		<Flyout button={props.children} middleware={offsetlessMiddlewares} placement="bottom">
			{({ close, menuProps }) => (
				<div {...menuProps} class={/* @once */ MenuRoot()}>
					{preferences.decks.map((deck) => (
						<button
							onClick={() => {
								close();

								if (deck.id !== props.value) {
									props.onChange(deck);
								}
							}}
							class={/* @once */ MenuItem()}
						>
							<span class="text-lg">{deck.emoji}</span>
							<span class="min-w-0 grow">{deck.name}</span>

							<CheckIcon class={clsx([`text-xl text-accent`, deck.id !== props.value && `invisible`])} />
						</button>
					))}
				</div>
			)}
		</Flyout>
	);
};

export default SwitchDeckAction;
