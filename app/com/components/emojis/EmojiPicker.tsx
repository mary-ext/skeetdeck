import {
	Suspense,
	batch,
	createEffect,
	createResource,
	createSelector,
	createSignal,
	onMount,
	useTransition,
} from 'solid-js';

import type { Emoji, SkinTone } from '@mary/emoji-db';

import SearchInput from '../inputs/SearchInput';
import { Flyout, offset } from '../Flyout';

import { Interactive } from '../../primitives/interactive';

import { type PickedEmoji, type SummarizedEmoji, getEmojiDb, summarizeEmojis } from './utils/database';
import { detectEmojiSupportLevel } from './utils/support';

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
const emojiBtn = Interactive({ class: `h-9 w-9 overflow-hidden rounded text-xl` });
const categoryBtn = Interactive({ class: `relative h-9 w-9 rounded text-xl` });

export interface EmojiPickerProps {
	multiple?: boolean;
	onPick: (emoji: PickedEmoji, close: boolean) => void;
}

const enum KeyboardState {
	NO = 0,
	YES = 1,
	YES_WITH_POINTER_OVER = 2,
}

const EmojiPicker = (props: EmojiPickerProps) => {
	let scrollRef: HTMLDivElement | undefined;
	let inputRef: HTMLInputElement | undefined;

	const onPick = props.onPick;

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

	const [isPointerOver, setIsPointerOver] = createSignal(false);
	const [hasKeyboard, setHasKeyboard] = createSignal(KeyboardState.NO);
	const [selected, setSelected] = createSignal<{ emoji: SummarizedEmoji; index: number }>();

	const isSelected = createSelector(() => selected()?.emoji);

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
		<div class="w-max bg-background" style="width:340px">
			<div class="flex gap-2 p-2">
				<SearchInput
					ref={(node) => {
						inputRef = node;

						onMount(() => {
							node.focus();
						});
					}}
					value={search()}
					onInput={(ev) => {
						start(() => {
							const value = ev.target.value;

							setSearch(value);

							setHasKeyboard(KeyboardState.NO);
							setSelected(undefined);
						});
					}}
					onKeyDown={(ev) => {
						const key = ev.key;

						if (key === 'Enter') {
							const $selected = selected();
							const $isKeyboardEnabled = hasKeyboard();

							ev.preventDefault();

							if ($isKeyboardEnabled && $selected) {
								const isShiftHeld = props.multiple && ev.shiftKey;
								const emoji = $selected.emoji;

								onPick({ ...emoji, picked: renderEmoji(emoji) }, !isShiftHeld);
							}
						} else if (
							key === 'ArrowUp' ||
							key === 'ArrowRight' ||
							key === 'ArrowDown' ||
							key === 'ArrowLeft'
						) {
							const $emojis = !emojis.error ? emojis.latest : undefined;
							const $selected = selected();

							ev.preventDefault();

							if (!$emojis) {
								return;
							}

							setHasKeyboard(!isPointerOver() ? KeyboardState.YES : KeyboardState.YES_WITH_POINTER_OVER);

							if (!$selected) {
								if ($emojis.length > 0) {
									setSelected({ emoji: $emojis[0], index: 0 });
								}

								return;
							}

							let delta = 0;

							if (key === 'ArrowUp') {
								delta = -9;
							} else if (key === 'ArrowRight') {
								delta = 1;
							} else if (key === 'ArrowDown') {
								delta = 9;
							} else if (key === 'ArrowLeft') {
								delta = -1;
							}

							const index = $selected.index;
							let nextIndex = index + delta;

							if (nextIndex >= $emojis.length) {
								nextIndex = $emojis.length - 1;
							} else if (nextIndex < 0) {
								nextIndex = 0;
							}

							if (index === nextIndex) {
								return;
							}

							const nextEmoji = $emojis[nextIndex];
							setSelected({ emoji: nextEmoji, index: nextIndex });
						}
					}}
				/>

				<Flyout
					middleware={[
						offset,
						{
							name: 'skintone-offset',
							fn: (state) => {
								return { x: state.x + 0.5, y: state.y - 0.5 };
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
						<div {...menuProps} class="box-content w-9 rounded border border-divider bg-background shadow-md">
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

			<div
				onKeyDown={(ev) => {
					const key = ev.key;
					let code: number;

					// Move to search box if the user tries to type something
					if (
						!ev.metaKey &&
						!ev.ctrlKey &&
						key.length === 1 &&
						((code = key.charCodeAt(0)), (code >= 97 && code <= 122) || (code >= 65 && code <= 90))
					) {
						ev.preventDefault();

						inputRef!.focus();
						document.execCommand('inserttext', false, key);
					}
				}}
				class="flex justify-center border-b border-divider px-2 pb-1"
			>
				{EMOJI_GROUPS.map(([id, emoji, name]) => {
					return (
						<button
							type="button"
							title={name}
							onClick={() => {
								start(() => {
									setGroup(id);
									setSearch('');

									setHasKeyboard(KeyboardState.NO);
									setSelected(undefined);
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
				<div
					ref={scrollRef}
					onPointerEnter={() => {
						setIsPointerOver(true);
					}}
					onPointerLeave={() => {
						setIsPointerOver(false);

						if (hasKeyboard() === KeyboardState.YES_WITH_POINTER_OVER) {
							setHasKeyboard(KeyboardState.YES);
						} else {
							setSelected(undefined);
						}
					}}
					class="h-64 overflow-y-auto"
				>
					<div class="m-2 grid w-max grid-cols-9 place-items-center">
						{(() => {
							const children = emojis()?.map((emoji, index) => {
								return (
									<button
										ref={(node) => {
											createEffect(() => {
												if (isSelected(emoji) && hasKeyboard()) {
													node.scrollIntoView({ block: 'nearest' });
												}
											});
										}}
										type="button"
										aria-label={/* @once */ emoji.annotation}
										onPointerOver={() => {
											if (hasKeyboard() !== KeyboardState.YES_WITH_POINTER_OVER) {
												batch(() => {
													setSelected({ emoji, index });
													setHasKeyboard(KeyboardState.NO);
												});
											}
										}}
										onClick={(ev) => {
											const isShiftHeld = props.multiple && ev.shiftKey;
											onPick({ ...emoji, picked: renderEmoji(emoji) }, !isShiftHeld);
										}}
										class={emojiBtn}
										classList={{
											[`bg-secondary/30`]: isSelected(emoji),
											[`outline`]: isSelected(emoji) && hasKeyboard() !== KeyboardState.NO,
										}}
									>
										{renderEmoji(emoji)}
									</button>
								);
							});

							if (!children || children.length === 0) {
								// Such that we still retain the width
								return <div class="h-9 w-9"></div>;
							}

							return children;
						})()}
					</div>
				</div>
			</Suspense>

			<div class="flex items-center gap-2 border-t border-divider p-2">
				<div class="text-2xl">
					{(() => {
						const $selected = selected();
						return $selected ? renderEmoji($selected.emoji) : SKINTONE_EMOJIS[tone()];
					})()}
				</div>

				<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
					{(() => {
						const $selected = selected();

						return $selected ? $selected.emoji.annotation : `Select an emoji...`;
					})()}
				</span>
			</div>
		</div>
	);
};

export default EmojiPicker;
