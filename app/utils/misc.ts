export function assert(condition: any, message = 'Assertion failed'): asserts condition {
	if ((import.meta as any).env.DEV && !condition) {
		throw new Error(message);
	}
}
