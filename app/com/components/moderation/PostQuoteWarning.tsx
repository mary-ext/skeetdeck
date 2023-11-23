import { type JSX, Show, createSignal } from 'solid-js';

import type { UnionOf } from '~/api/atp-schema.ts';

import { type ModerationDecision, CauseLabel, CauseMutedKeyword } from '~/api/moderation/action.ts';
import { getQuoteModMaker } from '~/api/moderation/decisions/quote.ts';

import { useSharedPreferences } from '../SharedPreferences.tsx';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;

export interface PostQuoteWarningProps {
	quote: EmbeddedPostRecord;
	children?: (mod: ModerationDecision | null) => JSX.Element;
}

const PostQuoteWarning = (props: PostQuoteWarningProps) => {
	return (
		<Show
			when={(() => {
				const quote = props.quote;

				const maker = getQuoteModMaker(quote, useSharedPreferences().moderation);
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
