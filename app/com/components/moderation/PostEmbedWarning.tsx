import { type JSX, createMemo, createSignal } from 'solid-js';

import { renderLabelName } from '~/api/display.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { CauseLabel } from '~/api/moderation/action.ts';
import { FlagNoOverride } from '~/api/moderation/enums.ts';

import { getPostModMaker } from '~/api/moderation/decisions/post.ts';

import VisibilityIcon from '~/com/icons/baseline-visibility.tsx';

import { useSharedPreferences } from '../SharedPreferences.tsx';

export interface PostEmbedWarningProps {
	post: SignalizedPost;
	children?: JSX.Element;
}

const PostEmbedWarning = (props: PostEmbedWarningProps) => {
	const decision = createMemo(() => {
		const post = props.post;

		const maker = getPostModMaker(post, useSharedPreferences().moderation);
		const decision = maker();

		if (decision) {
			if (decision.m) {
				return decision;
			}
		}
	});

	const render = () => {
		const $decision = decision();

		if (!$decision) {
			return props.children;
		}

		const [show, setShow] = createSignal(false);

		const source = $decision.s;
		const forced = source.t === CauseLabel && source.d.f & FlagNoOverride;
		const title = source.t === CauseLabel ? renderLabelName(source.l.val) : `Media warning`;

		return [
			<button
				disabled={!!forced}
				onClick={() => setShow(!show())}
				class="mt-3 flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left hover:bg-secondary/30 disabled:pointer-events-none"
			>
				<VisibilityIcon class="shrink-0 text-base text-muted-fg" />
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
