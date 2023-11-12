import { type JSX, Show, createSignal } from 'solid-js';

import type { Records, UnionOf } from '~/api/atp-schema.ts';

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

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

export interface PostQuoteWarningProps {
	quote: EmbeddedPostRecord;
	children?: (mod: ModerationDecision | null) => JSX.Element;
}

const PostQuoteWarning = (props: PostQuoteWarningProps) => {
	return (
		<Show
			when={(() => {
				const quote = props.quote;

				const maker = ((quote as any).$moderation ||=
					createPostModDecision(quote)) as () => ModerationDecision | null;

				const decision = maker();

				if (decision) {
					if (decision.b) {
						return decision;
					}
				}
			})()}
			fallback={props.children?.(null)}
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

						<Show when={show()}>{props.children?.(decision)}</Show>
					</>
				);
			}}
		</Show>
	);
};

export default PostQuoteWarning;

const createPostModDecision = (quote: EmbeddedPostRecord) => {
	const opts = useModeration();

	let prev: unknown[] = [];
	let decision: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = quote.labels;
		const text = (quote.value as PostRecord).text;

		const authorDid = quote.author.did;
		const isMuted = quote.author.viewer?.muted;

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
