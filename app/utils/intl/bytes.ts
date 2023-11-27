const BYTE = 1;
const KILOBYTE = BYTE * 1000;
const MEGABYTE = KILOBYTE * 1000;
const GIGABYTE = MEGABYTE * 1000;

export const formatBytes = (size: number) => {
	let num = size;
	let fractions = 0;
	let unit: string;

	if (size < KILOBYTE) {
		unit = 'byte';
	} else if (size < MEGABYTE) {
		num /= KILOBYTE;
		unit = 'kilobyte';
	} else if (size < GIGABYTE) {
		num /= MEGABYTE;
		unit = 'megabyte';
	} else {
		num /= GIGABYTE;
		unit = 'gigabyte';
	}

	if (num > 100) {
		fractions = 0;
	} else if (num > 10) {
		fractions = 1;
	} else if (num > 1) {
		fractions = 2;
	}

	return num.toLocaleString('en-US', {
		style: 'unit',
		unit: unit,
		unitDisplay: 'short',
		maximumFractionDigits: fractions,
	});
};
