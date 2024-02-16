const SECOND = 1e3;
const NOW = SECOND * 10;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
// const MONTH = WEEK * 4;
// const YEAR = MONTH * 12;

const absWithYearFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const absFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const absTimeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' });

const formatters: Record<string, Intl.NumberFormat> = {};

export const formatReltime = (time: string | number | Date, base = new Date()) => {
	const date = new Date(time);
	let delta = base.getTime() - date.getTime();

	// show absolute date if it's been more than a week, or if the date is in the
	// future for whatever reason.
	if (delta < 0 || delta > WEEK) {
		// skip showing current year
		if (date.getFullYear() === base.getFullYear()) {
			return absFormat.format(date);
		}

		return absWithYearFormat.format(date);
	}

	// show `now` if it just happened
	if (delta < NOW) {
		return `now`;
	}

	const [value, unit] = lookupReltime(delta);

	const formatter = (formatters[unit] ||= new Intl.NumberFormat('en-US', {
		style: 'unit',
		unit: unit,
		unitDisplay: 'narrow',
	}));

	return formatter.format(Math.abs(value));
};

export const formatAbsDate = (time: string | number) => {
	const date = new Date(time);
	return absWithYearFormat.format(date);
};

export const formatAbsDateTime = (time: string | number) => {
	const date = new Date(time);
	return absTimeFormat.format(date);
};

export const lookupReltime = (delta: number): [value: number, unit: Intl.RelativeTimeFormatUnit] => {
	if (delta < SECOND) {
		return [0, 'second'];
	}

	if (delta < MINUTE) {
		return [Math.floor(delta / SECOND), 'second'];
	}

	if (delta < HOUR) {
		return [Math.floor(delta / MINUTE), 'minute'];
	}

	if (delta < DAY) {
		return [Math.floor(delta / HOUR), 'hour'];
	}

	// use rounding, this handles the following scenario:
	// - 2024-02-13T09:00Z <- 2024-02-15T07:00Z = 2d
	return [Math.round(delta / DAY), 'day'];
	// if (delta < WEEK) {
	// 	return [Math.trunc(delta / DAY), 'day'];
	// }

	// if (delta < MONTH) {
	// 	return [Math.trunc(delta / WEEK), 'week'];
	// }

	// if (delta < YEAR) {
	// 	return [Math.trunc(delta / MONTH), 'month'];
	// }

	// return [Math.trunc(delta / YEAR), 'year'];
};
