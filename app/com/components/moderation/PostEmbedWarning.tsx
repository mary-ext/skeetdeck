import { Show, type JSX, createSignal } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';

import { type ModerationDecision, CauseLabel } from '~/api/moderation/action.ts';

import { createPostModDecision } from './PostWarning.tsx';

export interface PostEmbedWarningProps {
	post: SignalizedPost;
	children?: JSX.Element;
}

const PostEmbedWarning = (props: PostEmbedWarningProps) => {
	return (
		<Show
			when={(() => {
				const post = props.post;

				const maker = (post.$moderation ||= createPostModDecision(post)) as () => ModerationDecision | null;
				const decision = maker();

				if (decision) {
					if (decision.m) {
						return decision;
					}
				}
			})()}
			fallback={props.children}
			keyed
		>
			{(decision) => {
				const [show, setShow] = createSignal(false);

				const source = decision.s;
				const title = `Media warning${source.t === CauseLabel ? `: ${source.l.val}` : ''}`;

				return (
					<>
						<div class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
							<p class="m-3 text-sm text-muted-fg">{title}</p>

							<button
								onClick={() => setShow(!show())}
								class="px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
							>
								{show() ? 'Hide' : 'Show'}
							</button>
						</div>

						<Show when={show()}>{props.children}</Show>
					</>
				);
			}}
		</Show>
	);
};

export default PostEmbedWarning;
