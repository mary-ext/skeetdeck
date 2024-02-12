import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import { RouterView, configureRouter } from '../lib/index.tsx';

import './styles.css';

// `@types/dom-navigation` isn't declaring one.
declare var navigation: Navigation;

interface NavigateOptions {
	replace?: boolean;
	info?: unknown;
	state?: unknown;
}

const navigate = (to: string, options?: NavigateOptions) => {
	return navigation.navigate(to, {
		history: options?.replace ? 'replace' : 'push',
		state: options?.state,
		info: options?.info,
	});
};

const HomeView = () => {
	return (
		<div class="home-view">
			<h1>Hello world!</h1>

			<div>
				<button
					onClick={() => {
						navigate(Routes.COUNTER);
					}}
				>
					Push counter view
				</button>
				<button
					onClick={() => {
						navigate(Routes.ABOUT);
					}}
				>
					Push about view
				</button>
			</div>
		</div>
	);
};

const CounterView = () => {
	const [count, setCount] = createSignal(0);

	return (
		<div class="counter-view">
			<div>
				<div>The count is: {count()}</div>
				<button onClick={() => setCount(count() + 1)}>Increment</button>
				<button onClick={() => setCount(count() - 1)}>Decrement</button>
			</div>

			<pre>{/* @once */ JSON.stringify(navigation.currentEntry!.getState())}</pre>

			<div>
				<button
					onClick={() => {
						navigate(Routes.COUNTER);
					}}
				>
					Push counter view
				</button>

				<button
					onClick={() => {
						navigate(Routes.ABOUT);
					}}
				>
					Push about view
				</button>
				<button
					onClick={() => {
						navigate(Routes.ABOUT, { replace: true });
					}}
				>
					Replace about view
				</button>

				<button
					onClick={() => {
						navigation.updateCurrentEntry({
							state: {
								rand: Math.random(),
							},
						});
					}}
				>
					Update current entry
				</button>
			</div>
		</div>
	);
};

const AboutView = () => {
	return (
		<div class="about-view">
			<h1>About solid-navigation...</h1>

			<div>
				<button
					onClick={() => {
						navigate(Routes.COUNTER);
					}}
				>
					Push counter view
				</button>
				<button
					onClick={() => {
						navigate(Routes.COUNTER, { replace: true });
					}}
				>
					Replace counter view
				</button>
			</div>
		</div>
	);
};

const Routes = {
	HOME: '/',
	COUNTER: '/counter',
	ABOUT: '/about',
};

configureRouter({
	routes: [
		{
			path: Routes.HOME,
			component: HomeView,
		},
		{
			path: Routes.COUNTER,
			component: CounterView,
			single: false,
		},
		{
			path: Routes.ABOUT,
			component: AboutView,
		},
	],
});

const App = () => {
	return (
		<div class="app">
			<RouterView />
		</div>
	);
};

render(() => <App />, document.getElementById('root')!);
