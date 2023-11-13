const SECOND = 1e3;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = MONTH * 12;

const absWithYearFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
const absFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' });
const absTimeFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' });

const formatters: Record<string, Intl.NumberFormat> = {};

export const formatReltime = (time: string | number, base = new Date()) => {
	const date = new Date(time);

	const num = date.getTime();
	const delta = Math.abs(num - base.getTime());

	if (delta > WEEK) {
		// if it's the same year, let's skip showing the year.
		if (date.getFullYear() === base.getFullYear()) {
			return absFormat.format(date);
		}

		return absWithYearFormat.format(date);
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
		return [Math.trunc(delta / SECOND), 'second'];
	}

	if (delta < HOUR) {
		return [Math.trunc(delta / MINUTE), 'minute'];
	}

	if (delta < DAY) {
		return [Math.trunc(delta / HOUR), 'hour'];
	}

	if (delta < WEEK) {
		return [Math.trunc(delta / DAY), 'day'];
	}

	if (delta < MONTH) {
		return [Math.trunc(delta / WEEK), 'week'];
	}

	if (delta < YEAR) {
		return [Math.trunc(delta / MONTH), 'month'];
	}

	return [Math.trunc(delta / YEAR), 'year'];
};
