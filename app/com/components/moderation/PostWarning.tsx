import { type Component, type ComponentProps, type JSX, createMemo, createSignal } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { renderLabelName } from '~/api/display';
import type { SignalizedPost } from '~/api/stores/posts';

import {
	type ModerationDecision,
	CauseLabel,
	CauseMutedKeyword,
	CauseMutedTemporary,
} from '~/api/moderation/action';
import { FlagNoOverride } from '~/api/moderation/enums';

import { getPostModDecision } from '../../moderation/post';

import { clsx } from '~/utils/misc';

import { useSharedPreferences } from '../SharedPreferences';

import VisibilityIcon from '../../icons/baseline-visibility';
import FilterAltIcon from '../../icons/baseline-filter-alt';
import PersonOffIcon from '../../icons/baseline-person-off';

export interface PostWarningProps {
	post: SignalizedPost;
	timelineDid?: At.DID;
	permalink?: boolean;
	children: (decision: () => ModerationDecision | null) => JSX.Element;
}

const PostWarning = (props: PostWarningProps) => {
	const decision = createMemo(() => {
		return getPostModDecision(props.post, useSharedPreferences());
	});

	const verdict = createMemo(() => {
		const post = props.post;
		const permalink = props.permalink;
		const timelineDid = props.timelineDid;

		const $decision = decision();

		if ($decision) {
			if (permalink) {
				if ($decision.b && $decision.s.t === CauseLabel) {
					return $decision;
				}

				return;
			}

			if (
				$decision.b &&
				(!timelineDid ||
					$decision.s.t === CauseLabel ||
					$decision.s.t === CauseMutedKeyword ||
					timelineDid !== post.author.did)
			) {
				return $decision;
			}
		}
	});

	const render = () => {
		const $verdict = verdict();

		if (!$verdict) {
			return props.children(decision);
		}

		const [show, setShow] = createSignal(false);

		const source = $verdict.s;
		const type = source.t;

		const forced = type === CauseLabel && source.d.f & FlagNoOverride;

		let Icon: Component<ComponentProps<'svg'>>;
		let title: string;

		if (type === CauseLabel) {
			Icon = VisibilityIcon;
			title = renderLabelName(source.l.val);
		} else if (type === CauseMutedKeyword) {
			Icon = FilterAltIcon;
			title = source.n;
		} else if (type === CauseMutedTemporary) {
			Icon = PersonOffIcon;
			title = `Silenced user`;
		} else {
			Icon = PersonOffIcon;
			title = `Muted user`;
		}

		return [
			<button
				disabled={!!forced}
				onClick={() => setShow(!show())}
				class={clsx([
					`mt-3 flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left hover:bg-secondary/30 disabled:pointer-events-none`,
					show() && `mb-3`,
				])}
			>
				<Icon class="shrink-0 text-base text-muted-fg" />
				<span class="grow text-sm">{title}</span>

				{!forced && <span class="text-de font-medium text-accent">{show() ? `Hide` : `Show`}</span>}
			</button>,

			!forced &&
				(() => {
					if (show()) {
						return props.children(decision);
					}
				}),
		];
	};

	return render as unknown as JSX.Element;
};

export default PostWarning;
