import { type JSX, createMemo, createSignal } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import { renderLabelName } from '~/api/display.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { CauseLabel, CauseMutedKeyword } from '~/api/moderation/action.ts';
import { FlagNoOverride } from '~/api/moderation/enums.ts';

import { getPostModMaker } from '~/api/moderation/decisions/post.ts';

import { useSharedPreferences } from '../SharedPreferences.tsx';

export interface PostWarningProps {
	post: SignalizedPost;
	timelineDid?: DID;
	permalink?: boolean;
	children?: JSX.Element;
}

const PostWarning = (props: PostWarningProps) => {
	const decision = createMemo(() => {
		const post = props.post;
		const permalink = props.permalink;
		const timelineDid = props.timelineDid;

		const maker = getPostModMaker(post, useSharedPreferences().moderation);
		const decision = maker();

		if (decision) {
			if (permalink) {
				if (decision.b && decision.s.t === CauseLabel) {
					return decision;
				}

				return;
			}

			if (
				decision.b &&
				(!timelineDid ||
					decision.s.t === CauseLabel ||
					decision.s.t === CauseMutedKeyword ||
					timelineDid !== post.author.did)
			) {
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

		const title =
			source.t === CauseLabel
				? `Content warning: ${renderLabelName(source.l.val)}`
				: source.t === CauseMutedKeyword
				  ? `Filtered: ${source.n}`
				  : `You've muted this user`;

		return [
			<div
				class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider"
				classList={{ 'mb-3': show() }}
			>
				<p class="m-3 text-sm text-muted-fg">{title}</p>

				{!forced && (
					<button
						onClick={() => setShow(!show())}
						class="px-4 text-sm font-medium hover:bg-secondary/30 hover:text-secondary-fg"
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

export default PostWarning;
