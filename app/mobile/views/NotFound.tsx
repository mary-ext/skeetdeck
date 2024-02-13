import ViewHeader from '../components/ViewHeader';

const NotFoundView = () => {
	return (
		<div class="contents">
			<ViewHeader title="" back="/" />
			<div class="p-4">
				<h2 class="text-lg font-bold">Page not found</h2>
				<p class="mb-4 text-sm">
					We're sorry, but the link you followed might be broken, or the page may have been removed.
				</p>
			</div>
		</div>
	);
};

export default NotFoundView;
