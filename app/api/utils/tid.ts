let lastTimestamp: number = 0;
let timestampCount: number = 0;
let clockId: number | null = null;

export const getCurrentTid = () => {
	// JS does not have microsecond precision, instead, we append a counter to the timestamp to
	// indicate if multiple timestamps were created within the same millisecond take max of current
	// time & last timestamp to prevent TIDs moving backwards if system clock drifts backwards

	const time = Math.max(Date.now(), lastTimestamp);

	if (time === lastTimestamp) {
		timestampCount++;
	}
	lastTimestamp = time;

	const timestamp = time * 1000 + timestampCount;

	// the bottom 32 clock ids can be randomized & are not guaranteed to becollision resistant
	// we use the same clockid for all tids coming from this machine
	if (clockId === null) {
		clockId = Math.floor(Math.random() * 32);
	}

	return `${s32encode(timestamp)}${s32encode(clockId).padStart(2, '2')}`;
};

const S32_CHAR = '234567abcdefghijklmnopqrstuvwxyz';

export const s32encode = (i: number): string => {
	let s = '';
	while (i) {
		const c = i % 32;
		i = Math.floor(i / 32);
		s = S32_CHAR.charAt(c) + s;
	}
	return s;
};
