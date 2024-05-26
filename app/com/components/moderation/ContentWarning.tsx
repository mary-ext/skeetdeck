import { createSignal, lazy, type Component, type ComponentProps, type JSX } from 'solid-js';

import type { At } from '~/api/atp-schema';

import {
	CauseLabel,
	CauseMutedKeyword,
	CauseMutedPermanent,
	CauseMutedTemporary,
	SeverityAlert,
	getLocalizedLabel,
	type ModerationCause,
	type ModerationCauseType,
	type ModerationService,
	type ModerationUI,
} from '~/api/moderation';

import { openModal } from '../../globals/modals';

import { Interactive } from '../../primitives/interactive';

import FilterAltOutlinedIcon from '../../icons/outline-filter-alt';
import InfoOutlinedIcon from '../../icons/outline-info';
import PersonOffOutlinedIcon from '../../icons/outline-person-off';
import ReportProblemOutlinedIcon from '../../icons/outline-report-problem';

const LabelDetailsDialog = lazy(() => import('../dialogs/LabelDetailsDialog'));

export interface ContentWarningProps {
	ui: ModerationUI | undefined;
	ignoreMute?: boolean;
	ignoreDid?: At.DID;
	children: JSX.Element;
	containerClass?: string;
	innerClass?: string;
	outerClass?: string;
}

const toggleBtn = Interactive({
	class: `border border-divider flex h-11 w-full items-center gap-3 rounded-md px-3 text-primary/85 hover:text-primary`,
});

const ContentWarning = (props: ContentWarningProps) => {
	return (() => {
		const ui = props.ui;
		const blur = ui?.b[0];

		if (!blur || (props.ignoreMute && isOnlyMuted(ui.b))) {
			return <div class={props.outerClass}>{props.children}</div>;
		}

		const [override, setOverride] = createSignal(false);

		const type = blur.t;

		let Icon: Component<ComponentProps<'svg'>>;
		let title: string;
		let forced: boolean | undefined;

		if (type === CauseLabel) {
			const def = blur.d;
			const severity = def.s;

			Icon = severity === SeverityAlert ? ReportProblemOutlinedIcon : InfoOutlinedIcon;
			title = getLocalizedLabel(def).n;
			forced = !ui.o;
		} else if (type === CauseMutedKeyword) {
			Icon = FilterAltOutlinedIcon;
			title = blur.n;
		} else if (type === CauseMutedTemporary) {
			Icon = PersonOffOutlinedIcon;
			title = `Silenced user`;
		} else {
			Icon = PersonOffOutlinedIcon;
			title = `Muted user`;
		}

		return (
			<div class={props.containerClass}>
				<button disabled={forced} onClick={() => setOverride(!override())} class={toggleBtn}>
					<Icon class="shrink-0 text-base text-muted-fg" />
					<span class="grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-sm">{title}</span>

					<span hidden={forced} class="text-de font-medium text-muted-fg">
						{!override() ? `Show` : `Hide`}
					</span>
				</button>

				{(() => {
					if (type === CauseLabel && !override()) {
						const source = blur.s;

						return (
							<div class="mt-1.5 text-de text-muted-fg">
								Applied by <span>{source ? renderLabelSource(source) : `the author`}</span>.{' '}
								<button
									onClick={() => {
										openModal(() => <LabelDetailsDialog cause={blur} />);
									}}
									class="text-accent hover:underline"
								>
									Learn more
								</button>
							</div>
						);
					}
				})()}

				{(() => {
					if (override()) {
						return <div class={props.innerClass}>{props.children}</div>;
					}
				})()}
			</div>
		);
	}) as unknown as JSX.Element;
};

export default ContentWarning;

const renderLabelSource = (source: ModerationService) => {
	const profile = source.profile;

	if (profile) {
		return profile.displayName || `@${profile.handle}`;
	}

	return source.did;
};

const isOnlyMuted = (causes: ModerationCause[]) => {
	let t: ModerationCauseType;
	return causes.every((c) => (t = c.t) === CauseMutedTemporary || t === CauseMutedPermanent);
};
