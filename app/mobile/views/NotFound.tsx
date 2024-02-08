import { Button } from '~/com/primitives/button.ts';
import { getEntryAt } from '../utils/router.ts';

const NotFoundView = () => {
	return (
		<div class="p-4">
			<h2 class="text-lg font-bold">Page not found</h2>
			<p class="mb-4 text-sm">
				We're sorry, but the link you followed might be broken, or the page may have been removed.
			</p>

			<button
				onClick={() => {
					if (getEntryAt(-1)) {
						navigation.back();
					} else {
						navigation.navigate('/', { history: 'replace' });
					}
				}}
				class={/* @once */ Button({ variant: 'primary' })}
			>
				Go back
			</button>
		</div>
	);
};

export default NotFoundView;
