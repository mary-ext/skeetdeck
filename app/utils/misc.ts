export function assert(condition: any, message = 'Assertion failed'): asserts condition {
	if ((import.meta as any).env.DEV && !condition) {
		throw new Error(message);
	}
}

let uid = 0;
export const getUniqueId = () => {
	return `_${uid++}_`;
};
