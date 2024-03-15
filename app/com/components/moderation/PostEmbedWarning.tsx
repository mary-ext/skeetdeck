import { type JSX, createMemo, createSignal } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts';

import { type ModerationDecision, CauseLabel, FlagsForced, getLocalizedLabel } from '~/api/moderation';

import VisibilityOutlinedIcon from '~/com/icons/outline-visibility';

export interface PostEmbedWarningProps {
	post: SignalizedPost;
	decision: ModerationDecision | undefined | null;
	children?: JSX.Element;
}

const PostEmbedWarning = (props: PostEmbedWarningProps) => {
	const verdict = createMemo(() => {
		const $decision = props.decision;

		if ($decision) {
			if ($decision.m) {
				return $decision;
			}
		}
	});

	const render = () => {
		const $verdict = verdict();

		if (!$verdict) {
			return props.children;
		}

		const [show, setShow] = createSignal(false);

		const source = $verdict.s;
		const forced = source.t === CauseLabel && source.d.f & FlagsForced;
		const title = source.t === CauseLabel ? getLocalizedLabel(source.d).n : `Media warning`;

		return [
			<button
				disabled={!!forced}
				onClick={() => setShow(!show())}
				class="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left hover:bg-secondary/30 disabled:pointer-events-none"
			>
				<VisibilityOutlinedIcon class="shrink-0 text-base text-muted-fg" />
				<span class="grow text-sm">{title}</span>

				{!forced && <span class="text-de font-medium text-accent">{show() ? `Hide` : `Show`}</span>}
			</button>,

			!forced &&
				(() => {
					if (show()) {
						return props.children;
					}
				}),
		];
	};

	return render as unknown as JSX.Element;
};

export default PostEmbedWarning;
