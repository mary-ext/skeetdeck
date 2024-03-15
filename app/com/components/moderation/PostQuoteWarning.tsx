import { type Component, type ComponentProps, type JSX, createMemo, createSignal } from 'solid-js';

import type { AppBskyEmbedRecord } from '~/api/atp-schema';

import {
	type ModerationDecision,
	CauseLabel,
	CauseMutedKeyword,
	CauseMutedTemporary,
	FlagsForced,
	getLocalizedLabel,
} from '~/api/moderation';

import { getQuoteModDecision } from '../../moderation/quote';

import { useSharedPreferences } from '../SharedPreferences';

import FilterAltOutlinedIcon from '../../icons/outline-filter-alt';
import PersonOffOutlinedIcon from '../../icons/outline-person-off';
import VisibilityOutlinedIcon from '../../icons/outline-visibility';

type EmbeddedPostRecord = AppBskyEmbedRecord.ViewRecord;

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
				const type = source.t;

				const forced = type === CauseLabel && source.d.f & FlagsForced;

				let Icon: Component<ComponentProps<'svg'>>;
				let title: string;

				if (type === CauseLabel) {
					Icon = VisibilityOutlinedIcon;
					title = `Quote contains ${getLocalizedLabel(source.d).n}`;
				} else if (type === CauseMutedKeyword) {
					Icon = FilterAltOutlinedIcon;
					title = source.n;
				} else if (type === CauseMutedTemporary) {
					Icon = PersonOffOutlinedIcon;
					title = `Quote from silenced user`;
				} else {
					Icon = PersonOffOutlinedIcon;
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
