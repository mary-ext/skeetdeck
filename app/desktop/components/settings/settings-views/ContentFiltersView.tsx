import { multiagent } from '~/api/globals/agent';

import { Interactive } from '~/com/primitives/interactive';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import {
	VIEW_HIDDEN_REPOSTERS,
	VIEW_LABEL_CONFIG,
	VIEW_SUBSCRIBED_LABELERS,
	VIEW_TEMPORARY_MUTES,
	useViewRouter,
} from './_router';

const selectItem = Interactive({
	class: `flex items-center justify-between gap-4 px-4 py-3 text-left text-sm disabled:opacity-50`,
});

const ContentFiltersView = () => {
	const router = useViewRouter();

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Content filters</h2>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<p class="p-4 text-base font-bold leading-5">Label filters</p>

				<button onClick={() => router.move({ type: VIEW_LABEL_CONFIG, kind: 'global' })} class={selectItem}>
					<span>Content filter preferences</span>
					<ChevronRightIcon class="text-xl text-muted-fg" />
				</button>

				<button onClick={() => router.move({ type: VIEW_SUBSCRIBED_LABELERS })} class={selectItem}>
					<span>Subscribed label providers</span>
					<ChevronRightIcon class="text-xl text-muted-fg" />
				</button>

				{/* <button onClick={() => router.move({ type: VIEW_CONTENT_FILTERS })} class={selectItem}>
					<span>Per-user label overrides</span>
					<ChevronRightIcon class="text-xl text-muted-fg" />
				</button> */}

				<hr class="mx-4 mt-1 border-divider" />

				<p class="p-4 text-base font-bold leading-5">User filters</p>

				<fieldset disabled={!multiagent.active} class="contents">
					<button onClick={() => router.move({ type: VIEW_TEMPORARY_MUTES })} class={selectItem}>
						<span>Temporarily muted users</span>
						<ChevronRightIcon class="text-xl text-muted-fg" />
					</button>

					<button onClick={() => router.move({ type: VIEW_HIDDEN_REPOSTERS })} class={selectItem}>
						<span>Hidden reposters</span>
						<ChevronRightIcon class="text-xl text-muted-fg" />
					</button>
				</fieldset>
			</div>
		</div>
	);
};

export default ContentFiltersView;
