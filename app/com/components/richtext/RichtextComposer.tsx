import { autoUpdate, flip, offset, shift } from '@floating-ui/dom';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useFloating } from 'solid-floating-ui';
import {
	For,
	type JSX,
	Match,
	Switch,
	createEffect,
	createMemo,
	createResource,
	createSignal,
} from 'solid-js';
import TextareaAutosize from 'solid-textarea-autosize';

import type { AppBskyActorDefs, At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import type { PreliminaryRichText } from '~/api/richtext/composer';

// import { graphemeLen } from '~/api/richtext/intl';
import { createDebouncedValue } from '~/utils/hooks';
import { isCtrlKeyPressed } from '~/utils/interaction';
import { assert, clsx } from '~/utils/misc';

import DefaultUserAvatar from '../../assets/default-user-avatar.svg?url';
import CircularProgress from '../CircularProgress';

export interface RichtextComposerProps {
	ref?: HTMLTextAreaElement | ((el: HTMLTextAreaElement) => void);

	type: 'post' | 'textarea';
	uid: At.DID | undefined;

	value: string;
	rt: PreliminaryRichText;
	onChange: (next: string) => void;
	onImageDrop?: (blob: File[]) => void;
	onKeyDown?: (ev: KeyboardEvent) => void;
	onSubmit?: () => void;

	minRows?: number;
	maxRows?: number;
	placeholder?: string;
}

const MENTION_AUTOCOMPLETE_RE = /(?<=^|\s)@([a-zA-Z0-9-.]+)$/;
const TRIM_MENTION_RE = /[.]+$/;

const findNodePosition = (node: Node, position: number): { node: Node; position: number } | undefined => {
	if (node.nodeType === Node.TEXT_NODE) {
		return { node, position };
	}

	const children = node.childNodes;
	for (let idx = 0, len = children.length; idx < len; idx++) {
		const child = children[idx];
		const textContentLength = child.textContent!.length;

		if (position <= textContentLength!) {
			return findNodePosition(child, position);
		}

		position -= textContentLength!;
	}

	return;
};

const escape = (str: string, attr: boolean) => {
	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || (attr ? char === 34 : char === 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	return escaped + str.substring(last);
};

const buildHtml = (rt: PreliminaryRichText) => {
	const segments = rt.segments;

	let str = '';

	for (let i = 0, ilen = segments.length; i < ilen; i++) {
		const segment = segments[i];

		const type = segment.type;

		if (type === 'link' || type === 'mention' || type === 'tag') {
			str += `<span class=text-accent>` + escape(segment.raw, false) + `</span>`;
		} else if (type === 'escape') {
			str += `<span class=opacity-50>` + escape(segment.raw, false) + `</span>`;
		} else if (type === 'mdlink') {
			const className = segment.valid ? `text-accent` : `text-red-500`;
			const [_0, label, _1, uri, _2] = segment.raw;

			str +=
				`<span class=opacity-50>${_0}</span>` +
				`<span class=${className}>${escape(label, false)}</span>` +
				`<span class=opacity-50>${_1}${escape(uri, false)}${_2}</span>`;
		} else {
			str += escape(segment.raw, false);
		}
	}

	return str;
};

const enum Suggestion {
	MENTION,
	EMOJI,
}

interface MentionSuggestionItem {
	type: Suggestion.MENTION;
	data: AppBskyActorDefs.ProfileViewBasic;
}

type SuggestionItem = MentionSuggestionItem;

const RichtextComposer = (props: RichtextComposerProps) => {
	let textarea: HTMLTextAreaElement | undefined;
	let renderer: HTMLDivElement | undefined;

	const type = props.type;

	const onChange = props.onChange;
	const onImageDrop = props.onImageDrop;
	const onKeyDown = props.onKeyDown;
	const onSubmit = props.onSubmit;

	const [showDrop, setShowDrop] = createSignal(false);

	const [inputCursor, setInputCursor] = createSignal<number>();
	const [menuSelection, setMenuSelection] = createSignal<number>();

	// `candidateMatch` needs the value after it has been committed to DOM
	const debouncedValue = createDebouncedValue(() => props.value, 0);

	const candidateMatch = createMemo(() => {
		const $cursor = inputCursor();

		if ($cursor == null) {
			return null;
		}

		const $val = debouncedValue();
		return $val.length === $cursor ? $val : $val.slice(0, $cursor);
	});

	const matchedCompletion = createMemo(() => {
		const $candidate = candidateMatch();

		if ($candidate === null) {
			return;
		}

		let match: RegExpExecArray | null;
		let type: Suggestion;

		if ((match = MENTION_AUTOCOMPLETE_RE.exec($candidate))) {
			type = Suggestion.MENTION;
		} else {
			return;
		}

		const start = match.index!;
		const length = match[0].length;

		const matched = match[1].toLowerCase();

		const rangeStart = findNodePosition(renderer!, start);
		const rangeEnd = findNodePosition(renderer!, start + length);

		let range: Range | undefined;
		if (rangeStart && rangeEnd) {
			range = new Range();
			range.setStart(rangeStart.node, rangeStart.position);
			range.setEnd(rangeEnd.node, rangeEnd.position);
		}

		return {
			type: type,
			range: range,
			index: start,
			length: length,
			query: type === Suggestion.MENTION ? matched.replace(TRIM_MENTION_RE, '') : matched,
		};
	});

	const debouncedMatchedCompletion = createDebouncedValue(
		matchedCompletion,
		500,
		(a, b) => a?.query === b?.query && a?.type === b?.type,
	);

	const [suggestions] = createResource(
		() => {
			const uid = props.uid;
			const match = debouncedMatchedCompletion();

			return uid && match ? ([uid, match] as const) : false;
		},
		async ([uid, match]): Promise<SuggestionItem[]> => {
			const type = match.type;

			const MATCH_LIMIT = 5;

			if (type === Suggestion.MENTION) {
				const agent = await multiagent.connect(uid);

				const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
					params: {
						q: match.query,
						limit: MATCH_LIMIT,
					},
				});

				return response.data.actors.map((item) => ({ type: Suggestion.MENTION, data: item }));
			}

			assert(false, `expected match`);
		},
	);

	const [floating, setFloating] = createSignal<HTMLElement>();
	const position = useFloating(() => matchedCompletion()?.range, floating, {
		placement: 'bottom-start',
		middleware: [shift({ padding: 12 }), flip(), offset({ mainAxis: 4 })],
		whileElementsMounted: autoUpdate,
	});

	const acceptSuggestion = (item: SuggestionItem) => {
		const $match = matchedCompletion();
		const type = item.type;

		if (!$match) {
			return;
		}

		let text: string;
		if (type === Suggestion.MENTION) {
			text = `@${item.data.handle} `;
		} else {
			assert(false, `expected type`);
		}

		textarea!.focus();
		textarea!.setSelectionRange($match.index, $match.index + $match.length);
		document.execCommand('insertText', false, text);
	};

	const handleInputSelection = () => {
		const start = textarea!.selectionStart;
		const end = textarea!.selectionEnd;

		setInputCursor(start === end ? start : undefined);
	};

	makeEventListener(document, 'selectionchange', () => {
		if (document.activeElement !== textarea) {
			return;
		}

		handleInputSelection();
	});

	return (
		<fieldset
			class={
				/* @once */ clsx([
					`group relative`,
					type === 'post' && `text-base`,
					type === 'textarea' &&
						`rounded-md border border-input text-sm outline-2 -outline-offset-1 outline-accent disabled:opacity-50 focus-within:outline`,
					// type === 'dm' && `grow self-stretch text-sm`,
				])
			}
		>
			<div
				ref={renderer}
				inert
				class={
					/* @once */ clsx([
						`absolute inset-0 z-0 whitespace-pre-wrap break-words`,
						type === 'post' && `pb-2 pr-4 pt-1`,
						type === 'textarea' && `px-3 py-[0.45rem]`,
						// type === 'dm' && `py-2.5`,
					])
				}
				innerHTML={buildHtml(props.rt)}
			></div>

			<TextareaAutosize
				ref={(node) => {
					textarea = node;

					// @ts-expect-error
					props.ref?.(node);
				}}
				value={props.value}
				placeholder={props.placeholder}
				minRows={props.minRows}
				maxRows={props.maxRows}
				class={
					/* @once */ clsx([
						`relative z-10 block w-full resize-none overflow-hidden bg-transparent text-transparent caret-primary outline-none placeholder:text-muted-fg`,
						type === 'post' && `pb-2 pr-4 pt-1`,
						type === 'textarea' && `px-3 py-[0.45rem]`,
						// type === 'dm' && `py-2.5`,
					])
				}
				onPaste={
					onImageDrop &&
					((ev) => {
						const items = ev.clipboardData?.items ?? [];
						let images: File[] = [];

						for (let idx = 0, len = items.length; idx < len; idx++) {
							const item = items[idx];

							if (item.kind === 'file' && item.type.startsWith('image/')) {
								const blob = item.getAsFile();

								if (blob) {
									images.push(blob);
								}
							}
						}

						if (images.length > 0) {
							ev.preventDefault();
							onImageDrop(images);
						}
					})
				}
				onDragEnter={
					onImageDrop &&
					((ev) => {
						const dataTransfer = ev.dataTransfer;

						ev.preventDefault();
						if (dataTransfer && dataTransfer.types.includes('Files')) {
							setShowDrop(true);
						}
					})
				}
				onDragLeave={
					onImageDrop &&
					((ev) => {
						ev.preventDefault();
						setShowDrop(false);
					})
				}
				onDragOver={
					onImageDrop &&
					((ev) => {
						ev.preventDefault();
					})
				}
				onDrop={
					onImageDrop &&
					((ev) => {
						const dataTransfer = ev.dataTransfer;
						if (dataTransfer && dataTransfer.types.includes('Files')) {
							const files = dataTransfer.files;

							let images: File[] = [];
							for (let idx = 0, len = files.length; idx < len; idx++) {
								const file = files[idx];

								if (file.type.startsWith('image/')) {
									images.push(file);
								}
							}

							if (images.length > 0) {
								onImageDrop(images);
							}
						}

						ev.preventDefault();
						setShowDrop(false);
					})
				}
				onInput={(ev) => {
					onChange(ev.target.value);
					setMenuSelection(undefined);
				}}
				onKeyDown={(ev) => {
					const key = ev.key;

					if (matchedCompletion()) {
						const $sel = menuSelection();
						const $suggestions = !suggestions.error && suggestions();

						if (key === 'Escape') {
							setInputCursor(undefined);
						} else if ($suggestions) {
							if (key === 'ArrowUp') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection($sel == null || $sel <= 0 ? $suggestions.length - 1 : $sel - 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if (key === 'ArrowDown') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection(($sel == null || $sel >= $suggestions.length - 1 ? -1 : $sel) + 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if (key === 'Enter') {
								ev.preventDefault();

								if ($sel != null) {
									const item = $suggestions[$sel];

									if (item) {
										acceptSuggestion(item);
									}
								}
							}
						}

						return;
					}

					if (onKeyDown) {
						onKeyDown(ev);

						if (ev.defaultPrevented) {
							return;
						}
					}

					if (key === 'Backspace') {
						setTimeout(handleInputSelection, 0);
					}

					if (onSubmit && key === 'Enter' && isCtrlKeyPressed(ev)) {
						ev.preventDefault();
						onSubmit();

						return;
					}
				}}
			/>

			{(() => {
				if (onImageDrop && showDrop()) {
					return (
						<div class="pointer-events-none absolute inset-0 mb-2 mr-4 rounded border-2 border-dashed border-accent"></div>
					);
				}
			})()}

			{matchedCompletion() && (
				<ul
					ref={setFloating}
					class="absolute z-40 hidden w-full max-w-sm overflow-auto rounded-md border border-divider bg-background shadow-md group-focus-within:block sm:w-max"
					style={{
						'max-width': 'calc(100% - 12px)',
						'min-width': `180px`,
						top: `${position.y ?? 0}px`,
						left: `${position.x ?? 0}px`,
					}}
				>
					<Switch>
						<Match when={suggestions.loading || (matchedCompletion() && !debouncedMatchedCompletion())}>
							<div class="flex h-14 w-full items-center justify-center">
								<CircularProgress />
							</div>
						</Match>

						<Match when={!suggestions.error && suggestions()}>
							{(suggestions) => (
								<For
									each={suggestions()}
									fallback={
										<div class="px-4 py-2">
											<span class="text-sm text-muted-fg">
												No {renderSuggestionLabel(matchedCompletion()!.type)} found matching this query
											</span>
										</div>
									}
								>
									{(item, index) => {
										const selected = () => menuSelection() === index();
										const type = item.type;

										let node: JSX.Element;
										if (type === Suggestion.MENTION) {
											const user = item.data;

											node = (
												<div class="contents">
													<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg">
														<img src={/* @once */ user.avatar || DefaultUserAvatar} class="h-full w-full" />
													</div>

													<div class="flex grow flex-col text-sm">
														<span class="line-clamp-1 break-all font-bold">
															{/* @once */ user.displayName || user.handle}
														</span>
														<span class="line-clamp-1 shrink-0 break-all text-muted-fg">
															@{/* @once */ user.handle}
														</span>
													</div>
												</div>
											);
										} else {
											assert(false, `expected type`);
										}

										return (
											<li
												ref={(node) => {
													createEffect(() => {
														if (selected()) {
															node.scrollIntoView({ block: 'center' });
														}
													});
												}}
												role="option"
												tabIndex={-1}
												aria-selected={selected()}
												onClick={() => {
													acceptSuggestion(item);
												}}
												// onMouseEnter={() => {
												// 	setMenuSelection(index());
												// }}
												class={clsx([
													`flex cursor-pointer items-center gap-4 px-3 py-2 hover:bg-secondary/30`,
													selected() && `bg-secondary/30`,
												])}
											>
												{node}
											</li>
										);
									}}
								</For>
							)}
						</Match>
					</Switch>
				</ul>
			)}
		</fieldset>
	);
};

export default RichtextComposer;

const renderSuggestionLabel = (suggestion: Suggestion) => {
	if (suggestion === Suggestion.MENTION) {
		return `users`;
	}

	return `N/A`;
};
