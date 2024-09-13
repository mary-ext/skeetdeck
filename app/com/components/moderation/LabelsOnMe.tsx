import { type JSX, lazy } from 'solid-js';

import type { At, ComAtprotoLabelDefs } from '~/api/atp-schema';

import { openModal } from '~/com/globals/modals';

import InfoOutlinedIcon from '../../icons/outline-info';
import type { ReportTarget } from '../dialogs/LabelsOnMeDialog';

const LabelsOnMeDialog = lazy(() => import('../dialogs/LabelsOnMeDialog'));

export interface LabelsOnMeProps {
	uid: At.DID;
	report: ReportTarget;
	labels: ComAtprotoLabelDefs.Label[] | undefined;
	class?: string;
}

const LabelsOnMe = (props: LabelsOnMeProps) => {
	return (() => {
		const uid = props.uid;
		const labels = props.labels;

		if (!labels) {
			return;
		}

		const filteredLabels = labels.filter((l) => l.src !== uid && l.val[0] !== '!');
		const count = filteredLabels.length;

		if (count === 0) {
			return;
		}

		return (
			<div class={props.class}>
				<button
					onClick={() => {
						openModal(() => <LabelsOnMeDialog uid={uid} labels={filteredLabels} report={props.report} />);
					}}
					class="flex items-center gap-2 rounded-md bg-secondary/30 px-2 text-de leading-6 text-primary/85 hover:bg-secondary/40 hover:text-primary"
				>
					<InfoOutlinedIcon />
					<span>{`${count} ${count === 1 ? `label` : `labels`} placed on this content`}</span>
				</button>
			</div>
		);
	}) as unknown as JSX.Element;
};

export default LabelsOnMe;
