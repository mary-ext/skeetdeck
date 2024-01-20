export const difference = <T>(a: Iterable<T>, b: Iterable<T>): Set<T> => {
	const set = new Set(a);

	for (const x of b) {
		set.delete(x);
	}

	return set;
};
