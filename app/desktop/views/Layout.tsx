import { For } from 'solid-js';

import { A, Outlet } from '@solidjs/router';

import { openModal } from '~/com/globals/modals.tsx';

import { preferences } from '../globals/settings.ts';

import interactive from '~/com/primitives/interactive.ts';

import AddIcon from '~/com/icons/baseline-add.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import SettingsDialog from '../components/settings/SettingsDialog.tsx';
import AddDeckDialog from '../components/settings/AddDeckDialog.tsx';

const menuIconButton = interactive({ class: 'h-11 text-lg' });

const DashboardLayout = () => {
	return (
		<div class="flex h-screen w-screen overflow-hidden">
			<div class="flex w-14 shrink-0 flex-col border-r border-divider">
				<p class="py-3 text-center text-xs font-medium text-muted-fg">Decks</p>

				<For each={preferences.decks}>
					{(deck) => (
						<A
							title={deck.name}
							href={/* @once */ `/decks/${deck.id}`}
							replace
							class={
								/* @once */ interactive({ class: 'group relative grid h-11 place-items-center text-lg' })
							}
							activeClass="is-active"
						>
							<div class="pointer-events-none absolute inset-0 hidden border-l-3 border-accent group-[.is-active]:block"></div>
							<span>{deck.emoji}</span>
						</A>
					)}
				</For>

				<button
					title="Add new deck"
					onClick={() => {
						openModal(() => <AddDeckDialog />);
					}}
					class={menuIconButton}
				>
					<AddIcon class="mx-auto" />
				</button>

				<div class="grow"></div>

				<button
					title="Open application settings"
					onClick={() => {
						openModal(() => <SettingsDialog />);
					}}
					class={menuIconButton}
				>
					<SettingsIcon class="mx-auto" />
				</button>
			</div>

			{/* <Suspense
				fallback={
					<div class="grid grow place-items-center">
						<CircularProgress />
					</div>
				}
			>
				<Outlet />
			</Suspense> */}

			<Outlet />
		</div>
	);
};

export default DashboardLayout;
