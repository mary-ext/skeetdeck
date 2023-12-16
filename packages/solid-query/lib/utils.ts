import { type Owner, createMemo, runWithOwner } from 'solid-js';

export function shouldThrowError<T extends (...args: Array<any>) => boolean>(
	throwError: boolean | T | undefined,
	params: Parameters<T>,
): boolean {
	// Allow throwError function to override throwing behavior on a per-error basis
	if (typeof throwError === 'function') {
		return throwError(...params);
	}

	return !!throwError;
}

interface MemoizedObject<T> {
	s: () => T;
	h: { [key: string | symbol]: () => unknown };
	o: Owner | null;
}

export const memoHandlers: ProxyHandler<MemoizedObject<any>> = {
	get(r, key) {
		const memo = (r.h[key] ||= runWithOwner(r.o, () => {
			const s = r.s;
			return createMemo(() => s()[key]);
		})!);

		return memo();
	},
};
