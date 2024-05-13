import { createSignal } from 'solid-js';

import { PANE_TYPE_SEARCH, type SearchPaneConfig } from '~/desktop/globals/panes';
import { addPane } from '~/desktop/globals/settings';

import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';
import TimelineList from '~/com/components/lists/TimelineList';
import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add';
import { IconButton } from '~/com/primitives/icon-button';

import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface HashtagPaneDialogProps {
	/** Expected to be static */
	tag: string;
}

const HashtagPaneDialog = (props: HashtagPaneDialogProps) => {
	const tag = props.tag;

	const { deck, pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const [sort, setSort] = createSignal<'top' | 'latest'>('latest');

	return (
		<PaneDialog>
			<PaneDialogHeader title={`#${tag}`}>
				<button
					title="Add as column"
					onClick={() => {
						addPane<SearchPaneConfig>(
							deck,
							{
								type: PANE_TYPE_SEARCH,
								uid: pane.uid,
								query: `#${tag}`,
								sort: sort(),
							},
							index() + 1,
						);

						modal.close();
					}}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<TableColumnRightAddIcon />
				</button>
			</PaneDialogHeader>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<TabbedPanel selected={sort()} onChange={setSort} dense>
					<TabbedPanelView label="Latest" value="latest">
						<TimelineList uid={pane.uid} params={{ type: 'search', query: `#${tag}`, sort: 'latest' }} />
					</TabbedPanelView>
					<TabbedPanelView label="Top" value="top">
						<TimelineList uid={pane.uid} params={{ type: 'search', query: `#${tag}`, sort: 'top' }} />
					</TabbedPanelView>
				</TabbedPanel>
			</div>
		</PaneDialog>
	);
};

export default HashtagPaneDialog;
