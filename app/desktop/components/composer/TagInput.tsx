import { autoUpdate, offset } from '@floating-ui/dom';
import { useFloating } from 'solid-floating-ui';
import { For, type JSX, createSignal, onCleanup } from 'solid-js';

import { graphemeLen } from '~/api/richtext/intl';

import { assert, clsx } from '~/utils/misc';

import { Interactive } from '~/com/primitives/interactive';

import { offsetlessMiddlewares } from '~/com/components/Flyout';

import CloseIcon from '~/com/icons/baseline-close';
import PoundIcon from '~/com/icons/baseline-pound';

export interface TagsInputProps {
	tags: string[];
	limit?: number;
}

const enum MoveAction {
	LEFT,
	RIGHT,
	ANYWHERE,
}

const tagBtn = Interactive({
	offset: false,
	class: `group flex min-w-0 items-center gap-1 rounded-full bg-secondary/30 px-2 leading-6`,
});

const TagsInput = (props: TagsInputProps) => {
	const [focused, setFocused] = createSignal(false);

	const [reference, setReference] = createSignal<HTMLElement>();
	const [floating, setFloating] = createSignal<HTMLElement>();

	const position = useFloating(reference, floating, {
		placement: 'top-start',
		middleware: [offset({ mainAxis: 8 }), ...offsetlessMiddlewares],
		whileElementsMounted: autoUpdate,
	});

	const tags = props.tags;
	const limit = props.limit ?? Infinity;

	const moveFocus = (target: HTMLElement, action: MoveAction) => {
		let sibling: HTMLButtonElement | HTMLInputElement | null;

		if (action === MoveAction.LEFT) {
			sibling = target.previousSibling as any;
		} else if (action === MoveAction.RIGHT) {
			sibling = target.nextSibling as any;
		} else if (action === MoveAction.ANYWHERE) {
			sibling = (target.previousSibling || target.nextSibling) as any;
		} else {
			assert(false);
		}

		if (sibling) {
			if (sibling instanceof HTMLInputElement && sibling.classList.contains('hidden')) {
				return;
			}

			sibling.focus();
			target.tabIndex = -1;
		}
	};

	return [
		() => {
			if (focused()) {
				onCleanup(() => {
					setFloating(undefined);
				});

				return (
					<div
						ref={setFloating}
						class="pointer-events-none z-10 rounded-md border border-divider bg-background px-2 py-1 text-de shadow-md"
						style={{
							position: position.strategy,
							top: `${position.y ?? 0}px`,
							left: `${position.x ?? 0}px`,
						}}
					>
						Press Enter to save your tag
					</div>
				);
			}
		},

		<div ref={setReference} class="flex flex-wrap gap-1.5 text-de text-primary/85">
			<For each={props.tags}>
				{(tag, index) => {
					let target: HTMLButtonElement;

					const removeSelf = () => {
						moveFocus(target, MoveAction.ANYWHERE);
						tags.splice(index(), 1);
					};

					const handleFocus = () => {
						target.tabIndex = 0;
					};

					const handleKeydown = (ev: KeyboardEvent) => {
						const key = ev.key;

						if (key === 'ArrowLeft') {
							ev.preventDefault();
							moveFocus(target, MoveAction.LEFT);
						} else if (key === 'ArrowRight') {
							ev.preventDefault();
							moveFocus(target, MoveAction.RIGHT);
						} else if (key === 'Enter' || key === 'Backspace') {
							ev.preventDefault();
							removeSelf();
						}
					};

					return (
						<button
							ref={(node) => {
								target = node;
							}}
							tabIndex={-1}
							onFocus={handleFocus}
							onClick={removeSelf}
							onKeyDown={handleKeydown}
							class={tagBtn}
						>
							<PoundIcon class="group-hover:hidden group-focus-visible:hidden" />
							<CloseIcon class="hidden group-hover:block group-focus-visible:block" />

							<span tabIndex={-1} class="overflow-hidden text-ellipsis whitespace-nowrap">
								{tag}
							</span>
						</button>
					);
				}}
			</For>

			<input
				tabIndex={0}
				type="text"
				placeholder="#add tags"
				class={clsx([
					`w-16 grow rounded-md bg-transparent leading-6 outline-2 outline-transparent outline placeholder:text-muted-fg`,
					tags.length >= limit && `hidden`,
				])}
				onFocus={(ev) => {
					const target = ev.currentTarget;
					target.tabIndex = 0;

					setFocused(true);
				}}
				onBlur={() => {
					setFocused(false);
				}}
				onKeyDown={(ev) => {
					const key = ev.key;
					const target = ev.currentTarget;

					if (key === 'Enter') {
						const value = target.value;
						const trimmed = value.trim();

						if (trimmed.length === 0) {
							if (value !== trimmed) {
								target.value = '';
							}
						} else if (graphemeLen(trimmed) > 64 || trimmed.length > 640) {
							// @todo: should probably put a better alert mechanism tbh
							target.animate(
								[
									{ outlineColor: '#ef4444' },
									{ outlineColor: '#ef4444', offset: 0.3 },
									{ outlineColor: 'transparent' },
								],
								{
									duration: 350,
								},
							);
						} else {
							target.value = '';
							ev.preventDefault();

							tags.push(trimmed);

							if (tags.length >= limit - 1) {
								moveFocus(target, MoveAction.LEFT);
							}
						}
					} else if (key === 'ArrowLeft') {
						const isStart = target.selectionStart === 0 && target.selectionStart === target.selectionEnd;

						if (isStart) {
							ev.preventDefault();
							moveFocus(target, MoveAction.LEFT);
						}
					} else if (key === 'Backspace') {
						const isStart = target.selectionStart === 0 && target.selectionStart === target.selectionEnd;

						if (isStart && props.tags.length > 0) {
							ev.preventDefault();
							tags.splice(-1, 1);
						}
					}
				}}
			/>
		</div>,
	] as unknown as JSX.Element;
};

export default TagsInput;
