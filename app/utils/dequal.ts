const keys = Object.keys;

export const dequal = (a: any, b: any): boolean => {
	let ctor: any;
	let len: number;

	if (a === b) {
		return true;
	}

	if (a && b && (ctor = a.constructor) === b.constructor) {
		if (ctor === Array) {
			if ((len = a.length) === b.length) {
				while (len--) {
					if (!dequal(a[len], b[len])) {
						return false;
					}
				}
			}

			return len === -1;
		} else if (!ctor || ctor === Object) {
			len = 0;

			for (ctor in a) {
				len++;

				if (!(ctor in b) || !dequal(a[ctor], b[ctor])) {
					return false;
				}
			}

			return keys(b).length === len;
		}
	}

	return a !== a && b !== b;
};

export const EQUALS_DEQUAL = { equals: dequal } as const;

export const sequal = (a: any[], b: any[]): boolean => {
	let len = a.length;

	if (len === b.length) {
		while (len--) {
			if (a[len] !== b[len]) {
				return false;
			}
		}
	}

	return len === -1;
};
