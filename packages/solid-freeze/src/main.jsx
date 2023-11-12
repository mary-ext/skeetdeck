import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import { Freeze } from '../lib/index.tsx';

const Counter = () => {
	const [count, setCount] = createSignal(0);

	return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
};

const App = () => {
	const [frozen, setFrozen] = createSignal(false);

	return (
		<div>
			<button onClick={() => setFrozen(!frozen())}>{frozen() ? 'Unfreeze' : 'Freeze'}</button>

			<Freeze freeze={frozen()}>
				<Counter />
			</Freeze>
		</div>
	);
};

render(() => <App />, document.getElementById('root'));
