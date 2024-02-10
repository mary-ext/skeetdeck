import CircularProgress from '~/com/components/CircularProgress';

import Pane from './Pane';

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
