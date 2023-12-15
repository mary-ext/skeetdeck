type EventFunction = (...args: any[]) => void;

export interface EventMap {
	[key: string]: EventFunction;
}

export class EventEmitter<Events extends EventMap> {
	#events?: Record<keyof Events, EventFunction | EventFunction[]>;

	on<E extends keyof Events>(type: E, listener: Events[E]) {
		let events: Record<keyof Events, EventFunction | EventFunction[]> | undefined;
		let existing: EventFunction | EventFunction[] | undefined;

		events = this.#events;
		if (events === undefined) {
			events = this.#events = Object.create(null);
		} else {
			existing = events[type];
		}

		if (existing === undefined) {
			events![type] = listener;
		} else if (typeof existing === 'function') {
			events![type] = [existing, listener];
		} else {
			existing.push(listener);
		}

		return () => this.off(type, listener);
	}
	off<E extends keyof Events>(type: E, listener: Events[E]) {
		const events = this.#events;

		if (events === undefined) {
			return;
		}

		const list = events[type];

		if (list == undefined) {
			return;
		}

		if (list === listener) {
			delete events[type];
		} else if (typeof list !== 'function') {
			const index = list.indexOf(listener);

			if (index !== -1) {
				if (list.length === 2) {
					events[type] = list[index === 0 ? 1 : 0];
				} else {
					list.splice(index, 1);
				}
			}
		}
	}

	emit<E extends keyof Events>(type: E, ...args: Parameters<Events[E]>) {
		const events = this.#events;

		if (events === undefined) {
			return;
		}

		const handler = events[type];

		if (handler === undefined) {
			return;
		}

		if (typeof handler === 'function') {
			handler.apply(this, args);
		} else {
			const handlers = handler.slice();

			for (let idx = 0, len = handlers.length; idx < len; idx++) {
				handlers[idx].apply(this, args);
			}
		}
	}
}
