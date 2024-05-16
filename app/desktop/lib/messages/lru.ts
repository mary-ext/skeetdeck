export interface LRUOptions<K, V> {
	maxSize: number;
	create(key: K): V;
	destroy?(value: V, key: K): void;
}

export type LRU<K, V> = ReturnType<typeof createLRU<K, V>>;

export const createLRU = <K, V>({ maxSize, create, destroy }: LRUOptions<K, V>) => {
	let map = new Map<K, V>();
	let last: V | undefined;

	return {
		get(key: K): V {
			if (!map.has(key)) {
				if (map.size >= maxSize) {
					for (const [key, value] of map) {
						destroy?.(value, key);
						map.delete(key);

						if (map.size < maxSize) {
							break;
						}
					}
				}

				const ret = create(key);
				map.set(key, (last = ret));

				return ret;
			}

			const value = map.get(key)!;

			if (value !== last) {
				map.delete(key);
				map.set(key, (last = value));
			}

			return value;
		},
		clear(): void {
			last = undefined;

			if (destroy) {
				for (const [key, value] of map) {
					destroy(value, key);
					map.delete(key);

					if (last === value) {
						last = undefined;
					}
				}
			} else {
				map.clear();
				last = undefined;
			}
		},
	};
};
