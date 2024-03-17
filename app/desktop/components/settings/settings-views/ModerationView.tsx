import { For, batch } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import { GLOBAL_LABELS } from '~/api/moderation';

import { useBustRevCache } from '~/com/components/SharedPreferences';

// import AddIcon from '~/com/icons/baseline-add';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';
import FilterAltOutlinedIcon from '~/com/icons/outline-filter-alt';
import RepeatOffIcon from '~/com/icons/baseline-repeat-off';
import VisibilityOffOutlinedIcon from '~/com/icons/outline-visibility-off';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import DefaultLabelerAvatar from '~/com/assets/default-labeler-avatar.svg?url';

import { preferences } from '../../../globals/settings';

import {
	VIEW_HIDDEN_REPOSTERS,
	VIEW_KEYWORD_FILTERS,
	VIEW_LABELER_CONFIG,
	VIEW_TEMPORARY_MUTES,
	useViewRouter,
} from './_router';
import { ListBox, ListBoxItem, ListGroup, ListGroupBlurb, ListGroupHeader } from './_styles';

import LabelItem from './content-filters/components/LabelItem';

const ModerationView = () => {
	const router = useViewRouter();

	const bustRef = useBustRevCache();

	const prefs = preferences.moderation.labels;
	const services = preferences.moderation.services;

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<h2 class="grow text-base font-bold">Moderation</h2>
			</div>
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				<div class={ListGroup}>
					<p class={ListGroupHeader}>Account moderation</p>

					<fieldset disabled class={ListBox}>
						<For each={multiagent.accounts}>
							{(account) => (
								<button onClick={() => router.move({ type: VIEW_KEYWORD_FILTERS })} class={ListBoxItem}>
									<img
										src={account.profile?.avatar || DefaultUserAvatar}
										class="h-8 w-8 shrink-0 rounded-full"
									/>

									<div class="flex min-w-0 grow flex-col text-sm">
										<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
											{account.profile?.displayName}
										</p>
										<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-muted-fg">
											{'@' + account.session.handle}
										</p>
									</div>

									<ChevronRightIcon class="shrink-0 text-xl text-muted-fg" />
								</button>
							)}
						</For>
					</fieldset>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Additional moderation tools</p>

					<div class={ListBox}>
						<button onClick={() => router.move({ type: VIEW_KEYWORD_FILTERS })} class={ListBoxItem}>
							<FilterAltOutlinedIcon class="shrink-0 text-lg text-muted-fg" />
							<span class="grow">Keyword filters</span>
							<ChevronRightIcon class="shrink-0 text-xl text-muted-fg" />
						</button>

						<button onClick={() => router.move({ type: VIEW_TEMPORARY_MUTES })} class={ListBoxItem}>
							<VisibilityOffOutlinedIcon class="shrink-0 text-lg text-muted-fg" />
							<span class="grow">Silenced users</span>
							<ChevronRightIcon class="shrink-0 text-xl text-muted-fg" />
						</button>

						<button onClick={() => router.move({ type: VIEW_HIDDEN_REPOSTERS })} class={ListBoxItem}>
							<RepeatOffIcon class="shrink-0 text-lg text-muted-fg" />
							<span class="grow">Hidden reposters</span>
							<ChevronRightIcon class="shrink-0 text-xl text-muted-fg" />
						</button>
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Content filters</p>

					<div class={ListBox}>
						{Object.values(GLOBAL_LABELS).map((def) => {
							const id = def.i;

							// Don't show system labels
							if (id[0] === '!') {
								return;
							}

							return (
								<LabelItem
									def={def}
									value={prefs[id]}
									onChange={(next) => {
										batch(() => {
											prefs[id] = next;
											bustRef();
										});
									}}
								/>
							);
						})}
					</div>
				</div>

				<div class={ListGroup}>
					<p class={ListGroupHeader}>Label providers</p>

					<div class={ListBox}>
						<For each={services}>
							{(service) => {
								const profile = service.profile;

								return (
									<button
										onClick={() => router.move({ type: VIEW_LABELER_CONFIG, did: service.did })}
										class={ListBoxItem}
									>
										<img
											src={profile.avatar || DefaultLabelerAvatar}
											class="mt-1 h-8 w-8 shrink-0 self-start rounded-md"
										/>

										<div class="flex min-w-0 grow flex-col text-sm">
											<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
												{profile.displayName}
											</p>
											<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-muted-fg">
												{'@' + profile.handle}
											</p>
										</div>

										<ChevronRightIcon class="mt-2.5 shrink-0 self-start text-xl text-muted-fg" />
									</button>
								);
							}}
						</For>

						{/* <button class={selectItem}>
							<AddIcon class="w-8 shrink-0 text-lg text-muted-fg" />
							<span class="grow">Add new provider</span>
						</button> */}
					</div>

					<p class={ListGroupBlurb}>
						Label providers are entities aiming to provide curated social experiences by annotating the
						content that you see on Bluesky.
					</p>
				</div>
			</div>
		</div>
	);
};

export default ModerationView;
