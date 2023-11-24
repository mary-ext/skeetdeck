import { type JSX, createMemo, createSignal } from 'solid-js';

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
	const decision = createMemo(() => {
		const quote = props.quote;

		const maker = getQuoteModMaker(quote, useSharedPreferences().moderation);
		const decision = maker();

		if (decision) {
			if (decision.b || decision.m) {
				return decision;
			}
		}
	});

	const render = () => {
		const $decision = decision();

		if (!$decision || !$decision.b) {
			return props.children?.($decision || null);
		}

		const [show, setShow] = createSignal(false);

		// this needs to be in an array, else Solid.js thinks it can be unwrapped
		// by the insertion effect handling `render`
		return [
			() => {
				const $show = show();

				if ($show) {
					return props.children?.($decision);
				}

				const source = $decision.s;

				const title =
					source.t === CauseLabel
						? `Content warning: ${source.l.val}`
						: source.t === CauseMutedKeyword
						  ? `Filtered: ${source.n}`
						  : `You've muted this user`;

				return (
					<div class="flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
						<p class="m-3 text-sm text-muted-fg">{title}</p>

						<button
							onClick={() => setShow(true)}
							class="px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
						>
							Show
						</button>
					</div>
				);
			},
		];
	};

	return render as unknown as JSX.Element;
};

export default PostQuoteWarning;
