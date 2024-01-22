import { type JSX, For, createMemo, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID, RefOf } from '~/api/atp-schema.ts';

import {
	searchProfilesTypeahead,
	searchProfilesTypeaheadKey,
} from '~/api/queries/search-profiles-typeahead.ts';

import { createDebouncedValue, createDerivedSignal } from '~/utils/hooks.ts';
import { model } from '~/utils/input.ts';
import { clsx } from '~/utils/misc.ts';

import SearchInput from '~/com/components/inputs/SearchInput.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';

export const SUGGESTION_SEARCH_POSTS = 0;
export const SUGGESTION_PROFILE = 1;

export type SuggestionType = typeof SUGGESTION_SEARCH_POSTS | typeof SUGGESTION_PROFILE;

export interface SearchPostsSuggestionItem {
	type: typeof SUGGESTION_SEARCH_POSTS;
	query: string;
}

export interface ProfileSuggestionItem {
	type: typeof SUGGESTION_PROFILE;
	id: DID;
	profile: RefOf<'app.bsky.actor.defs#profileViewBasic'>;
}

export type SuggestionItem = SearchPostsSuggestionItem | ProfileSuggestionItem;

export interface SearchFlyoutProps {
	uid: DID;
	onAccept: (item: SuggestionItem) => void;
}

export const SearchFlyout = (props: SearchFlyoutProps) => {
	const [search, setSearch] = createSignal('');

	const debouncedSearch = createDebouncedValue(search, 500);

	const profileSuggestions = createQuery(() => {
		const $debouncedSearch = debouncedSearch().trim();

		return {
			queryKey: searchProfilesTypeaheadKey(props.uid, $debouncedSearch, 5),
			queryFn: searchProfilesTypeahead,
		};
	});

	const reconciledProfileSuggestions = createMemo((prev: ProfileSuggestionItem[]) => {
		const mapping = new Map(prev.map((x) => [x.id, x]));
		const next: ProfileSuggestionItem[] = [];

		const data = profileSuggestions.data;

		if (data) {
			for (let i = 0, il = data.length; i < il; i++) {
				const profile = data[i];

				if (mapping.has(profile.did)) {
					next.push(mapping.get(profile.did)!);
				} else {
					next.push({ type: SUGGESTION_PROFILE, id: profile.did, profile: profile });
				}
			}
		}

		return next;
	}, []);

	const suggestions = createMemo((): SuggestionItem[] => {
		const $search = search().trim();
		const $profileSuggestions = reconciledProfileSuggestions();

		let items: SuggestionItem[] = [];

		if ($search) {
			items.push({
				type: SUGGESTION_SEARCH_POSTS,
				query: $search,
			});

			if ($profileSuggestions) {
				items = items.concat($profileSuggestions);
			}
		}

		return items;
	});

	const [selection, setSelection] = createDerivedSignal<number>(() => {
		// Reset index on suggestion changes
		return suggestions().length > 0 ? 0 : -1;
	});

	return (
		<div class="flex w-96 flex-col overflow-hidden rounded-lg bg-background pb-2 shadow-menu">
			<div class="p-4 pb-2">
				<SearchInput
					ref={model(search, setSearch)}
					autofocus
					onKeyDown={(ev) => {
						const key = ev.key;

						if (key === 'Enter' || key === 'ArrowUp' || key === 'ArrowDown') {
							const $index = selection();
							const $suggestions = suggestions();

							ev.preventDefault();

							if (key === 'Enter') {
								const item = $index !== -1 && $suggestions[$index];

								if (item) {
									props.onAccept(item);
								}
							} else if (key === 'ArrowUp') {
								setSelection(($index <= 0 ? $suggestions.length : $index) - 1);
							} else {
								setSelection(($index >= $suggestions.length - 1 ? -1 : $index) + 1);
							}
						}
					}}
				/>
			</div>
			<For each={suggestions()}>
				{(item, index) => {
					const type = item.type;
					let node: JSX.Element;

					if (type === SUGGESTION_SEARCH_POSTS) {
						node = (
							<p class="overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3">
								Search posts matching <strong>{/* @once */ item.query}</strong>
							</p>
						);
					} else if (type === SUGGESTION_PROFILE) {
						const profile = item.profile;

						node = (
							<div class="flex items-center gap-4 px-4 py-2">
								<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg">
									{
										/* @once */ profile.avatar && (
											<img src={/* @once */ profile.avatar} class="h-full w-full" />
										)
									}
								</div>

								<div class="flex min-w-0 grow flex-col text-sm">
									<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
										{/* @once */ profile.displayName}
									</p>
									<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
										{/* @once */ '@' + profile.handle}
									</p>
								</div>
							</div>
						);
					}

					return (
						<button
							onClick={() => props.onAccept(item)}
							onPointerOver={() => setSelection(index())}
							class={clsx([`cursor-pointer text-left text-sm`, index() === selection() && `bg-secondary/30`])}
						>
							{node}
						</button>
					);
				}}
			</For>

			{(() => {
				if (profileSuggestions.isFetching) {
					return (
						<div class="grid h-14 place-items-center">
							<CircularProgress />
						</div>
					);
				}

				if (suggestions().length === 0) {
					return <p class="px-4 py-3 text-sm text-muted-fg">Start searching...</p>;
				}
			})()}
		</div>
	);
};
