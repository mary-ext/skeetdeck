import { Queue } from './stack.ts';

export type IdleCallback = () => void;

const queue = new Queue<IdleCallback>();

let running = false;

const runTasks = (deadline: IdleDeadline) => {
	while (deadline.timeRemaining() > 0) {
		const callback = queue.shift();

		if (!callback) {
			break;
		}

		callback();
	}

	if (queue.size > 0) {
		requestIdleCallback(runTasks);
	} else {
		running = false;
	}
};

export const scheduleIdleTask = (task: IdleCallback) => {
	queue.push(task);

	if (!running) {
		running = true;
		requestIdleCallback(runTasks);
	}
};
