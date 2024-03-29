export const POSITION_ONLY = 0;
export const POSITION_FIRST = 1;
export const POSITION_LAST = 2;
export const POSITION_MIDDLE = 3;

export type ItemPosition = 0 | 1 | 2 | 3;

export const getItemPosition = (index: number, items: any[]): ItemPosition => {
	if (items.length === 1) {
		return POSITION_ONLY;
	}

	if (index === 0) {
		return POSITION_FIRST;
	}

	if (index === items.length - 1) {
		return POSITION_LAST;
	}

	return POSITION_MIDDLE;
};
