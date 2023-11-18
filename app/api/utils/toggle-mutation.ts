// https://github.com/bluesky-social/social-app/blob/019aae5f01cb7b503d242917ae0092c2818f3b71/src/lib/hooks/useToggleMutationQueue.ts

interface Task<TState> {
	on: boolean;
	res: (state: TState) => void;
	rej: (e: unknown) => void;
}

interface TaskQueue<TState> {
	curr: Task<TState> | null;
	next: Task<TState> | null;
}

export interface ToggleMutationOptions<TState> {
	initialState: () => TState;
	mutate: (prevState: TState, nextIsOn: boolean) => Promise<TState>;
	finalize: (finalState: TState) => void;
}

export class AbortError extends Error {
	name = 'AbortError';
}

export const createToggleMutation = <TState>({
	initialState,
	mutate,
	finalize,
}: ToggleMutationOptions<TState>) => {
	const queue: TaskQueue<TState> = {
		curr: null,
		next: null,
	};

	const process = async () => {
		if (queue.curr) {
			// There is another active processQueue call iterating over tasks.
			// It will handle any newly added tasks, so we should exit early.
			return;
		}

		// To avoid relying on the rendered state, capture it once at the start.
		// From that point on, and until the queue is drained, we'll use the real server state.
		let confirmedState: TState = initialState();
		try {
			while (queue.next) {
				const prev = queue.curr;
				const next = queue.next;
				queue.curr = next;
				queue.next = null;

				if (prev?.on === next.on) {
					// Skip multiple requests to update to the same value in a row.
					prev.rej(new (AbortError as any)());
					continue;
				}

				try {
					// The state received from the server feeds into the next task.
					// This lets us queue deletions of not-yet-created resources.
					confirmedState = await mutate(confirmedState, next.on);
					next.res(confirmedState);
				} catch (e) {
					next.rej(e);
				}
			}
		} finally {
			finalize(confirmedState);
			queue.curr = null;
			queue.next = null;
		}
	};

	const queueToggle = (isOn: boolean): Promise<TState> => {
		return new Promise((resolve, reject) => {
			// This is a toggle, so the next queued value can safely replace the queued one.
			if (queue.next) {
				queue.next.rej(new (AbortError as any)());
			}

			queue.next = { on: isOn, res: resolve, rej: reject };
			process();
		});
	};

	return queueToggle;
};
