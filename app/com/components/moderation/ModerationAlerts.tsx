import { lazy, type JSX } from 'solid-js';

import {
	CauseLabel,
	SeverityAlert,
	getLocalizedLabel,
	type LabelModerationCause,
	type ModerationCause,
	type ModerationUI,
} from '~/api/moderation';

import { openModal } from '~/com/globals/modals';

import InfoOutlinedIcon from '../../icons/outline-info';
import ReportProblemOutlinedIcon from '../../icons/outline-report-problem';

const LabelDetailsDialog = lazy(() => import('../dialogs/LabelDetailsDialog'));

export interface ModerationAlertsProps {
	ui: ModerationUI;
	class?: string;
}

const ModerationAlerts = (props: ModerationAlertsProps) => {
	return (() => {
		const ui = props.ui;
		const causes = ui.a.concat(ui.i).filter(isLabelCause);

		if (causes.length === 0) {
			return;
		}

		return (
			<div class={props.class}>
				<div class="flex flex-wrap gap-2">
					{
						/* @once */ causes.map((cause) => {
							return (
								<button
									onClick={() => {
										openModal(() => <LabelDetailsDialog cause={cause} />);
									}}
									class="flex items-center gap-2 rounded-md bg-secondary/30 px-2 text-de leading-6 text-primary/85 hover:bg-secondary/40 hover:text-primary"
								>
									{(() => {
										const Icon = cause.d.s === SeverityAlert ? ReportProblemOutlinedIcon : InfoOutlinedIcon;
										return <Icon />;
									})()}
									<span>
										{(() => {
											const localized = getLocalizedLabel(cause.d);
											return localized.n;
										})()}
									</span>
								</button>
							);
						})
					}
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

export default ModerationAlerts;

const isLabelCause = (c: ModerationCause): c is LabelModerationCause => {
	return c.t === CauseLabel;
};
