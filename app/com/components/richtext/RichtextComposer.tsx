import {
	type JSX,
	For,
	Match,
	Show,
	Switch,
	createEffect,
	createMemo,
	createResource,
	createSignal,
} from 'solid-js';

import { autoUpdate, flip, offset, shift } from '@floating-ui/dom';
import { makeEventListener } from '@solid-primitives/event-listener';
import { useFloating } from 'solid-floating-ui';
import TextareaAutosize from 'solid-textarea-autosize';

import type { DID, RefOf } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';

import type { PreliminaryRichText } from '~/api/richtext/composer.ts';
// import { graphemeLen } from '~/api/richtext/intl.ts';

import { createDebouncedValue } from '~/utils/hooks.ts';
import { isCtrlKeyPressed } from '~/utils/interaction.ts';
import { assert, clsx } from '~/utils/misc.ts';

import CircularProgress from '../CircularProgress.tsx';

export interface RichtextComposerProps {
	ref?: HTMLTextAreaElement | ((el: HTMLTextAreaElement) => void);

	uid: DID;

	value: string;
	rt: PreliminaryRichText;
	onChange: (next: string) => void;
	onSubmit?: () => void;
	onImageDrop?: (blob: File[]) => void;

	minRows?: number;
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
	data: RefOf<'app.bsky.actor.defs#profileViewBasic'>;
}

type SuggestionItem = MentionSuggestionItem;

const RichtextComposer = (props: RichtextComposerProps) => {
	let textarea: HTMLTextAreaElement | undefined;
	let renderer: HTMLDivElement | undefined;

	const onChange = props.onChange;
	const onSubmit = props.onSubmit;
	const onImageDrop = props.onImageDrop;

	const [showDrop, setShowDrop] = createSignal(false);

	const [inputCursor, setInputCursor] = createSignal<number>();
	const [menuSelection, setMenuSelection] = createSignal<number>();

	// `candidateMatch` needs the value after it has been committed to DOM
	const debouncedValue = createDebouncedValue(() => props.value, 0);

	const candidateMatch = createMemo(() => {
		const $cursor = inputCursor();

		if ($cursor == null) {
			return '';
		}

		const $val = debouncedValue();
		return $val.length === $cursor ? $val : $val.slice(0, $cursor);
	});

	const matchedCompletion = createMemo(() => {
		const $candidate = candidateMatch();

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
		debouncedMatchedCompletion,
		async (match): Promise<SuggestionItem[]> => {
			const type = match.type;

			const MATCH_LIMIT = 5;

			if (type === Suggestion.MENTION) {
				const $uid = props.uid;
				const agent = await multiagent.connect($uid);

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
		<div class="group relative">
			<div
				ref={renderer}
				class="absolute inset-0 z-0 whitespace-pre-wrap break-words pb-2 pr-4 text-base"
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
				class="relative z-10 block w-full resize-none overflow-hidden bg-transparent pb-2 pr-4 text-base text-transparent caret-primary outline-none placeholder:text-muted-fg"
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
				onDragOver={
					onImageDrop &&
					((ev) => {
						const dataTransfer = ev.dataTransfer;
						if (dataTransfer && dataTransfer.types.includes('Files')) {
							setShowDrop(true);
						}
					})
				}
				onDragLeave={
					onImageDrop &&
					(() => {
						setShowDrop(false);
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
								ev.preventDefault();
								onImageDrop(images);
							}
						}

						setShowDrop(false);
					})
				}
				onInput={(ev) => {
					onChange(ev.target.value);
					setMenuSelection(undefined);
				}}
				onKeyDown={(ev) => {
					const key = ev.key;

					if (key === 'Backspace') {
						setTimeout(handleInputSelection, 0);
					}

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
							} else if ($sel != null && key === 'Enter') {
								const item = $suggestions[$sel];

								ev.preventDefault();
								if (item) {
									acceptSuggestion(item);
								}
							}
						}

						return;
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
						<div class="pointer-events-none absolute inset-0 border-2 border-dashed border-accent"></div>
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
														<Show when={user.avatar} keyed>
															{(avatar) => <img src={avatar} class="h-full w-full" />}
														</Show>
													</div>

													<div class="flex grow flex-col text-sm">
														<span class="line-clamp-1 break-all font-bold">
															{user.displayName || user.handle}
														</span>
														<span class="line-clamp-1 shrink-0 break-all text-muted-fg">@{user.handle}</span>
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
													`flex cursor-pointer items-center gap-4 px-4 py-2 hover:bg-secondary/30`,
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
		</div>
	);
};

export default RichtextComposer;

const renderSuggestionLabel = (suggestion: Suggestion) => {
	if (suggestion === Suggestion.MENTION) {
		return `users`;
	}

	return `N/A`;
};
