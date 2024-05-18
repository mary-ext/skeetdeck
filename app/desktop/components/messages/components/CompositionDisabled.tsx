const CompositionDisabled = () => {
	return (
		<div class="px-3 pb-4">
			<div class="rounded-md bg-secondary/20 px-3 py-3">
				<p class="text-sm font-bold">Your clops have been clipped.</p>
				<p class="text-de text-muted-fg">
					Moderators have reviewed reports and subsequently disabled your ability to send messages to other
					users.
				</p>
			</div>
		</div>
	);
};

export default CompositionDisabled;
