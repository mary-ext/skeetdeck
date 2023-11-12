interface StackNode<T> {
	v: T;
	n?: StackNode<T>;
}

export class Stack<T> {
	private n?: StackNode<T>;

	push(value: T) {
		this.n = { v: value, n: this.n };
	}

	pop(): T | undefined {
		const node = this.n;

		if (node) {
			this.n = node.n;
			return node.v;
		}
	}
}

interface QueueNode<T> {
	v: T;
	n?: QueueNode<T>;
}

export class Queue<T> {
	private h?: QueueNode<T>;
	private t?: QueueNode<T>;

	public size = 0;

	push(value: T) {
		const node: QueueNode<T> = { v: value, n: undefined };

		if (this.h) {
			this.t!.n = node;
			this.t = node;
		} else {
			this.h = node;
			this.t = node;
		}

		this.size++;
	}

	shift(): T | undefined {
		const curr = this.h;

		if (!curr) {
			return;
		}

		this.h = curr.n;
		this.size--;

		return curr.v;
	}
}
