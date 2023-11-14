import { type JSX, Show, createSignal } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import {
	type ModerationCause,
	type ModerationDecision,
	CauseLabel,
	CauseMutedKeyword,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	finalizeModeration,
} from '~/api/moderation/action.ts';
import { PreferenceWarn } from '~/api/moderation/enums.ts';

import { sequal } from '~/utils/dequal.ts';

import { useModeration } from '~/com/components/moderation/ModerationContext.tsx';

export interface PostWarningProps {
	post: SignalizedPost;
	timelineDid?: DID;
	permalink?: boolean;
	children?: JSX.Element;
}

const PostWarning = (props: PostWarningProps) => {
	return (
		<Show
			when={(() => {
				const post = props.post;
				const permalink = props.permalink;
				const timelineDid = props.timelineDid;

				const maker = (post.$moderation ||= createPostModDecision(post)) as () => ModerationDecision | null;
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
			})()}
			fallback={props.children}
			keyed
		>
			{(decision) => {
				const [show, setShow] = createSignal(false);

				const source = decision.s;

				const title =
					source.t === CauseLabel
						? `Content warning: ${source.l.val}`
						: source.t === CauseMutedKeyword
						  ? `Filtered: ${source.n}`
						  : `You've muted this user`;

				return (
					<>
						<div
							class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider"
							classList={{ 'mb-3': show() }}
						>
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

export default PostWarning;

export const createPostModDecision = (post: SignalizedPost) => {
	const opts = useModeration();

	let prev: unknown[] = [];
	let decision: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = post.labels.value;
		const text = post.record.value.text;

		const authorDid = post.author.did;
		const isMuted = post.author.viewer.muted.value;

		const next = [labels, text, isMuted];

		if (!sequal(prev, next)) {
			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, opts);
			decideMutedPermanentModeration(accu, isMuted);
			// decideMutedTemporaryModeration(accu, isProfileTemporarilyMuted(uid, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, opts);

			prev = next;
			decision = finalizeModeration(accu);
		}

		return decision;
	};
};
