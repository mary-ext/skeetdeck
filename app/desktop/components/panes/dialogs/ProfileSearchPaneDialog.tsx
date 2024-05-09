import { createSignal } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles';

import { type SearchPaneConfig, PANE_TYPE_SEARCH } from '../../../globals/panes';
import { addPane } from '../../../globals/settings';

import TimelineList from '~/com/components/lists/TimelineList';
import SearchInput from '~/com/components/inputs/SearchInput';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';

import { IconButton } from '~/com/primitives/icon-button';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add';

import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';

export interface ProfileSearchPaneDialogProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const ProfileSearchPaneDialog = (props: ProfileSearchPaneDialogProps) => {
	const profile = props.profile;

	const { deck, pane } = usePaneContext();
	const modal = usePaneModalState();

	const [search, setSearch] = createSignal('');
	const [sort, setSort] = createSignal<'top' | 'latest'>('latest');

	return (
		<PaneDialog>
			<div class="flex h-13 min-w-0 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					type="button"
					title="Go back to previous dialog"
					onClick={modal.close}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<div class="grow">
					<SearchInput
						ref={(node) => {
							setTimeout(() => node.focus(), 0);
						}}
						placeholder={`Search @${profile.handle.value}'s posts`}
						onKeyDown={(ev) => {
							if (ev.key === 'Enter') {
								setSearch(ev.currentTarget.value.trim());
							}
						}}
					/>
				</div>

				<button
					disabled={search() === ''}
					title="Add this search query as a column"
					onClick={() => {
						const handle = profile.handle.value;
						const did = profile.did;
						const me = profile.uid === profile.did;

						addPane<SearchPaneConfig>(deck, {
							type: PANE_TYPE_SEARCH,
							uid: pane.uid,
							query: (me ? 'from:me' : handle !== 'invalid.handle' ? 'from:' + handle : did) + ' ' + search(),
							sort: sort(),
						});

						modal.close();
					}}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<TableColumnRightAddIcon />
				</button>
			</div>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				{search() !== '' ? (
					<TabbedPanel selected={sort()} onChange={setSort}>
						<TabbedPanelView label="Latest" value="latest">
							<TimelineList
								uid={/* @once */ profile.uid}
								params={{
									type: 'search',
									query: profile.did + ' ' + search(),
									sort: 'latest',
								}}
							/>
						</TabbedPanelView>
						<TabbedPanelView label="Top" value="top">
							<TimelineList
								uid={/* @once */ profile.uid}
								params={{
									type: 'search',
									query: profile.did + ' ' + search(),
									sort: 'top',
								}}
							/>
						</TabbedPanelView>
					</TabbedPanel>
				) : (
					<div class="flex flex-col items-center p-4">
						<p class="text-sm text-muted-fg">Try searching for keywords</p>
					</div>
				)}
			</div>
		</PaneDialog>
	);
};

export default ProfileSearchPaneDialog;
