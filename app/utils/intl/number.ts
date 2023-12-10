const long = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });

export const formatCompact = (value: number) => {
	if (value < 1_000) {
		return '' + value;
	}

	if (value < 100_000) {
		return long.format(value);
	}

	return compact.format(value);
};

export const formatLong = (value: number) => {
	if (value < 1_000) {
		return '' + value;
	}

	return long.format(value);
};
