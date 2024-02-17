let startOfYear = 0;
let endOfYear = 0;

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
const getNow = Date.now;

export const formatReltime = (time: number): string => {
	const now = getNow();
	const delta = now - time;

	if (delta < 0 || delta > WEEK) {
		if (now > endOfYear) {
			const date = new Date();

			date.setMonth(0, 1);
			date.setHours(0, 0, 0);
			startOfYear = date.getTime();

			date.setFullYear(date.getFullYear() + 1, 0, 0);
			date.setHours(23, 59, 59, 999);
			endOfYear = date.getTime();
		}

		// if it happened this year, don't show the year.
		if (time >= startOfYear && time <= endOfYear) {
			return absFormat.format(time);
		}

		return absWithYearFormat.format(time);
	}

	if (delta < NOW) {
		return `now`;
	}

	{
		let value: number;
		let unit: Intl.RelativeTimeFormatUnit;

		if (delta < MINUTE) {
			value = Math.floor(delta / SECOND);
			unit = 'second';
		} else if (delta < HOUR) {
			value = Math.floor(delta / MINUTE);
			unit = 'minute';
		} else if (delta < DAY) {
			value = Math.floor(delta / HOUR);
			unit = 'hour';
		} else {
			// use rounding, this handles the following scenario:
			// - 2024-02-13T09:00Z <- 2024-02-15T07:00Z = 2d
			value = Math.round(delta / DAY);
			unit = 'day';
		}

		const formatter = (formatters[unit] ||= new Intl.NumberFormat('en-US', {
			style: 'unit',
			unit: unit,
			unitDisplay: 'narrow',
		}));

		return formatter.format(Math.abs(value));
	}
};

export const formatAbsDate = (time: string | number) => {
	const date = new Date(time);
	return absWithYearFormat.format(date);
};

export const formatAbsDateTime = (time: string | number) => {
	const date = new Date(time);
	return absTimeFormat.format(date);
};
