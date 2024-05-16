const timeFormat = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });
const dateFormatWYear = new Intl.DateTimeFormat('en-US', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
});
const dateFormatWoYear = new Intl.DateTimeFormat('en-US', {
	day: 'numeric',
	month: 'long',
	hour: 'numeric',
	minute: '2-digit',
});

export const formatChatReltime = (time: string | number): string => {
	const curr = new Date();
	const date = new Date(time);

	const ftime = timeFormat.format(date);

	if (isSameDate(curr, date)) {
		return ftime;
	}

	const yesterday = new Date(curr);
	yesterday.setDate(yesterday.getDate() - 1);

	if (isSameDate(yesterday, date)) {
		return `Yesterday, ${ftime}`;
	}

	if (isSameYear(curr, date)) {
		return dateFormatWoYear.format(date);
	}

	return dateFormatWYear.format(date);
};

const isSameDate = (a: Date, b: Date) => {
	return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
};

const isSameYear = (a: Date, b: Date) => {
	return a.getFullYear() === b.getFullYear();
};
