import { type JSX, createMemo, createSignal } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';

import { CauseLabel } from '~/api/moderation/action.ts';
import { getPostModMaker } from '~/api/moderation/decisions/post.ts';

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
		const title = `Media warning${source.t === CauseLabel ? `: ${source.l.val}` : ''}`;

		return [
			<div class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
				<p class="m-3 text-sm text-muted-fg">{title}</p>

				<button
					onClick={() => setShow(!show())}
					class="px-4 text-sm font-medium hover:bg-secondary/30 hover:text-secondary-fg"
				>
					{show() ? 'Hide' : 'Show'}
				</button>
			</div>,

			() => {
				if (show()) {
					return props.children;
				}
			},
		];
	};

	return render as unknown as JSX.Element;
};

export default PostEmbedWarning;
