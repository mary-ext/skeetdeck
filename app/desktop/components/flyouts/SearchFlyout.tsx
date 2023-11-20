import { type JSX, For, createMemo, createSignal } from 'solid-js';

import { createQuery, keepPreviousData } from '@pkg/solid-query';

import type { DID, RefOf } from '~/api/atp-schema.ts';

import {
	searchProfilesTypeahead,
	searchProfilesTypeaheadKey,
} from '~/api/queries/search-profiles-typeahead.ts';

import { createDebouncedValue, createDerivedSignal } from '~/utils/hooks.ts';
import { model } from '~/utils/input.ts';

import SearchInput from '~/com/components/inputs/SearchInput.tsx';

export const enum SuggestionType {
	SEARCH_POSTS,
	PROFILE,
}

export interface SearchPostsSuggestionItem {
	type: SuggestionType.SEARCH_POSTS;
	query: string;
}

export interface ProfileSuggestionItem {
	type: SuggestionType.PROFILE;
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
			enabled: $debouncedSearch.length > 0 && !$debouncedSearch.includes(':'),
			queryKey: searchProfilesTypeaheadKey(props.uid, $debouncedSearch, 5),
			queryFn: searchProfilesTypeahead,
			placeholderData: keepPreviousData,
			select: (data) => {
				return data.map((profile): ProfileSuggestionItem => {
					return {
						type: SuggestionType.PROFILE,
						id: profile.did,
						profile: profile,
					};
				});
			},
			reconcile: 'id',
		};
	});

	const suggestions = createMemo((): SuggestionItem[] => {
		const $search = search().trim();
		const $profileSuggestions = profileSuggestions.data;

		let items: SuggestionItem[] = [];

		if ($search) {
			items.push({
				type: SuggestionType.SEARCH_POSTS,
				query: $search,
			});
		}

		if ($profileSuggestions && $search) {
			items = items.concat($profileSuggestions);
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
			<For each={suggestions()} fallback={<p class="px-4 py-3 text-sm text-muted-fg">Start searching...</p>}>
				{(item, index) => {
					let node: JSX.Element;

					if (item.type === SuggestionType.SEARCH_POSTS) {
						node = (
							<p class="overflow-hidden overflow-ellipsis whitespace-nowrap px-4 py-3">
								Search posts matching <strong>{/* @once */ item.query}</strong>
							</p>
						);
					} else if (item.type === SuggestionType.PROFILE) {
						const profile = item.profile;

						node = (
							<div class="flex items-center gap-4 px-4 py-2">
								<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg">
									{/* @once */ profile.avatar && <img src={profile.avatar} class="h-full w-full" />}
								</div>

								<div class="flex grow flex-col text-sm">
									<span class="line-clamp-1 break-all font-bold">
										{/* @once */ profile.displayName || profile.handle}
									</span>
									<span class="line-clamp-1 shrink-0 break-all text-muted-fg">@{profile.handle}</span>
								</div>
							</div>
						);
					}

					return (
						<button
							onClick={() => props.onAccept(item)}
							onPointerOver={() => setSelection(index())}
							class="cursor-pointer text-left text-sm"
							classList={{ [`bg-hinted`]: index() === selection() }}
						>
							{node}
						</button>
					);
				}}
			</For>
		</div>
	);
};
