import { Suspense, createEffect, createResource, createSignal, onMount, useTransition } from 'solid-js';

import type { Emoji, SkinTone } from '@pkg/emoji-db';

import SearchInput from '../inputs/SearchInput.tsx';
import { Flyout, offset } from '../Flyout.tsx';

import { Interactive } from '../../primitives/interactive.ts';

import { type PickedEmoji, type SummarizedEmoji, getEmojiDb, summarizeEmojis } from './utils/database.ts';
import { detectEmojiSupportLevel } from './utils/support.ts';

const EMOJI_GROUPS: [group: number, emoji: string, name: string][] = [
	[0, '😀', 'Smileys & emoticons'],
	[1, '👋', 'People & body'],
	[3, '🐱', 'Animals & nature'],
	[4, '🍎', 'Food & drink'],
	[5, '🏠️', 'Travel & places'],
	[6, '⚽', 'Activities'],
	[7, '📝', 'Objects'],
	[8, '⛔️', 'Symbols'],
	[9, '🏁', 'Flags'],
];

const SKINTONE_EMOJIS = ['👏', '👏🏻', '👏🏼', '👏🏽', '👏🏾', '👏🏿'];
const SKINTONE_LABELS = ['Default', 'Light', 'Medium-light', 'Medium', 'Medium-dark', 'Dark'];

const skinBtn = Interactive({ class: `h-9 w-9 rounded text-xl` });
const emojiBtn = Interactive({ class: `h-12 w-12 overflow-hidden rounded text-3xl` });
const categoryBtn = Interactive({ class: `relative h-9 w-9 rounded text-xl` });

export interface EmojiPickerProps {
	multiple?: boolean;
	onPick: (emoji: PickedEmoji, close: boolean) => void;
}

const EmojiPicker = (props: EmojiPickerProps) => {
	let scrollRef: HTMLDivElement | undefined;

	const database = getEmojiDb();

	const [search, setSearch] = createSignal('');
	const [group, setGroup] = createSignal(0);

	const [_pending, start] = useTransition();

	const [emojis] = createResource(
		() => [search(), group()] as const,
		async ([search, group]) => {
			const lv = await detectEmojiSupportLevel();

			let emojis: Emoji[];
			if (search && search.length >= 2) {
				emojis = await database.getEmojiBySearchQuery(search);
			} else {
				emojis = await database.getEmojiByGroup(group);
			}

			return summarizeEmojis(emojis, lv);
		},
	);

	const [tone, setTone] = createSignal<SkinTone>(0);

	const renderEmoji = (emoji: SummarizedEmoji) => {
		return emoji.skins?.[tone()] || emoji.unicode;
	};

	onMount(() => {
		database.getPreferredSkinTone().then(setTone);
	});

	createEffect(() => {
		emojis();

		if (scrollRef) {
			scrollRef.scrollTop = 0;
		}
	});

	return (
		<div class="w-max bg-background">
			<div class="flex gap-2 p-2">
				<SearchInput
					ref={(node) => {
						onMount(() => {
							node.focus();
						});
					}}
					value={search()}
					onInput={(ev) => {
						const value = ev.target.value;
						start(() => setSearch(value));
					}}
				/>

				<Flyout
					middleware={[
						offset,
						{
							name: 'skintone-offset',
							fn: (state) => {
								return { x: state.x + 1, y: state.y - 1 };
							},
						},
					]}
					button={
						<button
							type="button"
							title={`Change skin tone (currently ${SKINTONE_LABELS[tone()]})`}
							class={skinBtn}
						>
							{SKINTONE_EMOJIS[tone()]}
						</button>
					}
				>
					{({ close, menuProps }) => (
						<div
							{...menuProps}
							class="box-content w-9 rounded border border-divider bg-background shadow-xl shadow-black"
						>
							{SKINTONE_EMOJIS.map((emoji, index) => (
								<button
									type="button"
									title={/* @once */ SKINTONE_LABELS[index]}
									onClick={() => {
										close();
										setTone(index);
										database.setPreferredSkinTone(index);
									}}
									class={skinBtn}
								>
									{emoji}
								</button>
							))}
						</div>
					)}
				</Flyout>
			</div>

			<div class="flex border-b border-divider pb-1">
				{EMOJI_GROUPS.map(([id, emoji, name]) => {
					return (
						<button
							type="button"
							title={name}
							onClick={() => {
								start(() => {
									setGroup(id);
									setSearch('');
								});
							}}
							class={categoryBtn}
						>
							<span>{emoji}</span>

							{(() => {
								if (group() === id && search().length < 2) {
									return <div class="absolute inset-x-0 -bottom-1 h-1 rounded bg-accent"></div>;
								}
							})()}
						</button>
					);
				})}
			</div>

			<Suspense fallback={<div class="h-64"></div>}>
				<div ref={scrollRef} class="h-64 overflow-y-auto p-2">
					<div class="grid grid-cols-6">
						{(() => {
							const children = emojis()?.map((emoji) => {
								return (
									<button
										type="button"
										title={/* @once */ emoji.annotation}
										onClick={(ev) => {
											const isShiftHeld = props.multiple && ev.shiftKey;
											props.onPick({ ...emoji, picked: renderEmoji(emoji) }, !isShiftHeld);
										}}
										class={emojiBtn}
									>
										{renderEmoji(emoji)}
									</button>
								);
							});

							if (!children || children.length === 0) {
								// Such that we still retain the width
								return <div class="h-12 w-12"></div>;
							}

							return children;
						})()}
					</div>
				</div>
			</Suspense>
		</div>
	);
};

export default EmojiPicker;
