export function assert(condition: any, message = 'Assertion failed'): asserts condition {
	if (import.meta.env.DEV && !condition) {
		throw new Error(message);
	}
}

let uid = 0;
export const getUniqueId = () => {
	return `_${uid++}_`;
};

export const mapDefined = <T, R>(array: T[], mapper: (value: T) => R | undefined): R[] => {
	var mapped: R[] = [];

	var idx = 0;
	var len = array.length;
	var temp: R | undefined;

	for (; idx < len; idx++) {
		if ((temp = mapper(array[idx])) !== undefined) {
			mapped.push(temp);
		}
	}

	return mapped;
};
