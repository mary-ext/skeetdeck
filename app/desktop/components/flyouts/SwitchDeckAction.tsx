import type { JSX } from 'solid-js';

import { clsx } from '~/utils/misc';

import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import CheckIcon from '~/com/icons/baseline-check';

import type { DeckConfig } from '../../globals/panes';
import { preferences } from '../../globals/settings';

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
							<span class="text-sm">{deck.emoji}</span>
							<span class="min-w-0 grow">{deck.name}</span>

							<CheckIcon class={clsx([`text-base text-accent`, deck.id !== props.value && `invisible`])} />
						</button>
					))}
				</div>
			)}
		</Flyout>
	);
};

export default SwitchDeckAction;
