import CircularProgress from '~/com/components/CircularProgress.tsx';

import Pane from './Pane.tsx';

const PaneFallback = () => {
	return (
		<Pane>
			<div class="grid grow place-items-center">
				<CircularProgress />
			</div>
		</Pane>
	);
};

export default PaneFallback;
