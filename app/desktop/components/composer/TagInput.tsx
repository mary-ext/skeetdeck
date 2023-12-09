import { For } from 'solid-js';

import { graphemeLen } from '~/api/richtext/intl.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import PoundIcon from '~/com/icons/baseline-pound.tsx';

export interface TagsInputProps {
	tags: string[];
	limit?: number;
	onChange: (next: string[]) => void;
}

const tagBtn = Interactive({
	offset: false,
	class: `group flex min-w-0 items-center gap-1 rounded-full bg-secondary/30 px-2 leading-6`,
});

const TagsInput = (props: TagsInputProps) => {
	const onChange = props.onChange;

	return (
		<div class="flex flex-wrap gap-1.5 text-sm">
			<For each={props.tags}>
				{(tag, index) => (
					<button
						tabIndex={-1}
						onFocus={(ev) => {
							const target = ev.currentTarget as HTMLButtonElement | HTMLInputElement;
							target.tabIndex = 0;
						}}
						onKeyDown={(ev) => {
							const key = ev.key;
							const target = ev.currentTarget as HTMLButtonElement;

							if (key === 'ArrowLeft') {
								const sibling = target.previousSibling as HTMLButtonElement | null;

								ev.preventDefault();

								if (sibling) {
									sibling.focus();
									target.tabIndex = -1;
								}
							} else if (key === 'ArrowRight') {
								const sibling = target.nextSibling as HTMLButtonElement | HTMLInputElement | null;

								ev.preventDefault();

								if (sibling) {
									if (sibling instanceof HTMLInputElement && sibling.classList.contains('hidden')) {
										return;
									}

									sibling.focus();
									target.tabIndex = -1;
								}
							} else if (key === 'Enter' || key === 'Backspace') {
								const sibling = (target.previousSibling || target.nextSibling) as HTMLElement | null;

								const clone = props.tags.slice();
								clone.splice(index(), 1);

								ev.preventDefault();

								if (sibling) {
									sibling.focus();
									target.tabIndex = -1;
								}

								onChange(clone);
							}
						}}
						class={tagBtn}
					>
						<PoundIcon class="group-hover:hidden group-focus-visible:hidden" />
						<CloseIcon class="hidden group-hover:block group-focus-visible:block" />

						<span tabIndex={-1} class="overflow-hidden text-ellipsis whitespace-nowrap">
							{tag}
						</span>
					</button>
				)}
			</For>

			<input
				tabIndex={0}
				type="text"
				placeholder="#add tags"
				class="min-w-0 grow rounded-md bg-transparent leading-6 outline-2 outline-transparent outline placeholder:text-muted-fg"
				classList={{ [`hidden`]: props.limit !== undefined && props.tags.length >= props.limit }}
				onFocus={(ev) => {
					const target = ev.currentTarget;
					target.tabIndex = 0;
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
							const tags = props.tags;
							const limit = props.limit;

							target.value = '';
							ev.preventDefault();

							onChange(props.tags.concat(trimmed));

							if (limit !== undefined && tags.length >= limit - 1) {
								const sibling = target.previousSibling as HTMLButtonElement | null;

								if (sibling) {
									sibling.focus();
									target.tabIndex = -1;
								}
							}
						}
					} else if (key === 'ArrowLeft') {
						const isStart = target.selectionStart === 0 && target.selectionStart === target.selectionEnd;

						if (isStart) {
							const sibling = target.previousSibling as HTMLButtonElement | null;

							ev.preventDefault();

							if (sibling) {
								sibling.focus();
								target.tabIndex = -1;
							}
						}
					} else if (key === 'Backspace') {
						const isStart = target.selectionStart === 0 && target.selectionStart === target.selectionEnd;

						if (isStart && props.tags.length > 0) {
							props.onChange(props.tags.slice(0, -1));
						}
					}
				}}
			/>
		</div>
	);
};

export default TagsInput;
