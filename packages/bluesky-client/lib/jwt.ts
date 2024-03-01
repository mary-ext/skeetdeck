const b64DecodeUnicode = (str: string): string => {
	return decodeURIComponent(
		atob(str).replace(/(.)/g, (_m, p) => {
			let code = p.charCodeAt(0).toString(16).toUpperCase();

			if (code.length < 2) {
				code = '0' + code;
			}

			return '%' + code;
		}),
	);
};

export const base64UrlDecode = (str: string): string => {
	var output = str.replace(/-/g, '+').replace(/_/g, '/');

	switch (output.length % 4) {
		case 0:
			break;
		case 2:
			output += '==';
			break;
		case 3:
			output += '=';
			break;
		default:
			throw new Error('base64 string is not of the correct length');
	}

	try {
		return b64DecodeUnicode(output);
	} catch (err) {
		return atob(output);
	}
};

export const decodeJwt = (token: string): unknown => {
	const pos = 1;
	const part = token.split('.')[1];

	let decoded: string;

	if (typeof part !== 'string') {
		throw new Error('invalid token: missing part ' + (pos + 1));
	}

	try {
		decoded = base64UrlDecode(part);
	} catch (e) {
		throw new Error('invalid token: invalid b64 for part ' + (pos + 1) + ' (' + (e as Error).message + ')');
	}

	try {
		return JSON.parse(decoded);
	} catch (e) {
		throw new Error('invalid token: invalid json for part ' + (pos + 1) + ' (' + (e as Error).message + ')');
	}
};
