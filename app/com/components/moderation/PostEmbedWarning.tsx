import { type JSX, createMemo, createSignal } from 'solid-js';

import { renderLabelNames } from '~/api/display.ts';
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
		const title = source.t === CauseLabel ? renderLabelNames(source.l.val) : `Media warning`;

		return [
			<div class="mt-3 flex min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider">
				<VisibilityIcon class="ml-3 shrink-0 text-base text-muted-fg" />
				<span class="grow py-3 text-sm">{title}</span>

				{!forced && (
					<button
						onClick={() => setShow(!show())}
						class="self-stretch px-3 text-de font-medium text-accent hover:bg-secondary/30"
					>
						{show() ? 'Hide' : 'Show'}
					</button>
				)}
			</div>,

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
