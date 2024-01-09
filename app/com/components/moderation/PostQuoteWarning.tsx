import { type Component, type ComponentProps, type JSX, createMemo, createSignal } from 'solid-js';

import type { UnionOf } from '~/api/atp-schema.ts';
import { renderLabelName } from '~/api/display.ts';

import { type ModerationDecision, CauseLabel, CauseMutedKeyword } from '~/api/moderation/action.ts';
import { FlagNoOverride } from '~/api/moderation/enums.ts';

import { getQuoteModDecision } from '~/api/moderation/decisions/quote.ts';

import { useSharedPreferences } from '../SharedPreferences.tsx';

import VisibilityIcon from '../../icons/baseline-visibility.tsx';
import FilterAltIcon from '../../icons/baseline-filter-alt.tsx';
import PersonOffIcon from '../../icons/baseline-person-off.tsx';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;

export interface PostQuoteWarningProps {
	quote: EmbeddedPostRecord;
	children?: (mod: ModerationDecision | null) => JSX.Element;
}

const PostQuoteWarning = (props: PostQuoteWarningProps) => {
	const decision = createMemo(() => {
		return getQuoteModDecision(props.quote, useSharedPreferences());
	});

	const verdict = createMemo(() => {
		const $decision = decision();

		if ($decision) {
			if ($decision.b || $decision.m) {
				return $decision;
			}
		}
	});

	const render = () => {
		const $verdict = verdict();

		if (!$verdict || !$verdict.b) {
			return props.children?.($verdict || null);
		}

		const [show, setShow] = createSignal(false);

		// this needs to be in an array, else Solid.js thinks it can be unwrapped
		// by the insertion effect handling `render`
		return [
			() => {
				const $show = show();

				if ($show) {
					return props.children?.($verdict);
				}

				const source = $verdict.s;
				const forced = source.t === CauseLabel && source.d.f & FlagNoOverride;

				let Icon: Component<ComponentProps<'svg'>>;
				let title: string;

				if (source.t === CauseLabel) {
					Icon = VisibilityIcon;
					title = `Quote contains ${renderLabelName(source.l.val)}`;
				} else if (source.t === CauseMutedKeyword) {
					Icon = FilterAltIcon;
					title = source.n;
				} else {
					Icon = PersonOffIcon;
					title = `Quote from muted user`;
				}

				return (
					<button
						disabled={!!forced}
						onClick={() => setShow(!show())}
						class="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left hover:bg-secondary/30 disabled:pointer-events-none"
					>
						<Icon class="shrink-0 text-base text-muted-fg" />
						<span class="grow text-sm">{title}</span>

						{!forced && <span class="text-de font-medium text-accent">{show() ? `Hide` : `Show`}</span>}
					</button>
				);
			},
		];
	};

	return render as unknown as JSX.Element;
};

export default PostQuoteWarning;
