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

export const clsx = (arr: (string | 0 | false | undefined | null)[]): string => {
	var res = '';
	var tmp: any;

	for (var i = 0, ilen = arr.length; i < ilen; i++) {
		if ((tmp = arr[i])) {
			res && (res += ' ');
			res += tmp;
		}
	}

	return res;
};

export const chunked = <T>(arr: T[], size: number): T[][] => {
	const chunks: T[][] = [];

	for (let i = 0, il = arr.length; i < il; i += size) {
		chunks.push(arr.slice(i, i + size));
	}

	return chunks;
};
