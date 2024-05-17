import { createMemo, createSignal } from 'solid-js';
import { getRtLength, parseRt } from '~/api/richtext/composer';

import type { SignalizedConvo } from '~/api/stores/convo';
import RichtextComposer from '~/com/components/richtext/RichtextComposer';

import SendOutlinedIcon from '~/com/icons/outline-send';
import { IconButton } from '~/com/primitives/icon-button';

export interface CompositionProps {
	/** Expected to be static */
	convo: SignalizedConvo;
}

const Composition = (props: CompositionProps) => {
	// const [focused, setFocused] = createSignal(false);
	// const [userExpanded, setUserExpanded] = createSignal(false);

	const convo = props.convo;
	const uid = convo.uid;

	const [text, setText] = createSignal('');

	const rt = createMemo(() => parseRt(text()));
	const length = createMemo(() => getRtLength(rt()));

	return (
		<div class="px-3 pb-4">
			<div class="flex items-center gap-2 rounded-md bg-secondary/30 pl-3 pr-1">
				{/* {!focused() || text().length === 0 ? (
					<div class="flex">
						<button
							ref={(node) => {
								onMount(() => {
									if (userExpanded()) {
										node.focus();
										setUserExpanded(false);
									}
								});
							}}
							class={IconButton({ color: 'muted' })}
						>
							<ImageOutlinedIcon />
						</button>
						<button class={IconButton({ color: 'muted' })}>
							<GifBoxOutlinedIcon />
						</button>
						<button class={IconButton({ color: 'muted' })}>
							<EmojiEmotionsOutlinedIcon />
						</button>
					</div>
				) : (
					<div>
						<button
							onClick={() => {
								batch(() => {
									setFocused(false);
									setUserExpanded(true);
								});
							}}
							class={IconButton({ color: 'muted' })}
						>
							<ChevronRightIcon class="rotate-180" />
						</button>
					</div>
				)} */}

				{/* <TextareaAutosize
					value={text()}
					onInput={(ev) => {
						// setFocused(true);
						setText(ev.target.value);
					}}
					placeholder="Start a new message"
					minRows={1}
					maxRows={6}
					class="grow resize-none self-stretch bg-transparent py-2.5 pl-3 text-sm text-primary outline-none placeholder:text-muted-fg"
				/> */}

				<RichtextComposer
					uid={uid}
					type="dm"
					value={text()}
					rt={rt()}
					onChange={setText}
					onKeyDown={(ev) => {
						if (ev.key === 'Enter' && !ev.shiftKey) {
							ev.preventDefault();
						}
					}}
					minRows={1}
					maxRows={6}
					placeholder="Send a message"
				/>

				<button disabled={length() === 0} class={/* @once */ IconButton({ color: 'muted' })}>
					<SendOutlinedIcon />
				</button>
			</div>
		</div>
	);
};

export default Composition;
