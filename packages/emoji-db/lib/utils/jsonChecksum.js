/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
const arrayBufferToBinaryString = (buffer) => {
	let binary = '';
	let bytes = new Uint8Array(buffer);
	let length = bytes.byteLength;
	let i = -1;

	while (++i < length) {
		binary += String.fromCharCode(bytes[i]);
	}

	return binary;
};

/**
 * @param {string} binary
 * @returns {ArrayBuffer}
 */
const binaryStringToArrayBuffer = (binary) => {
	let length = binary.length;
	let buf = new ArrayBuffer(length);
	let arr = new Uint8Array(buf);
	let i = -1;

	while (++i < length) {
		arr[i] = binary.charCodeAt(i);
	}

	return buf;
};

// generate a checksum based on the stringified JSON
export const jsonChecksum = async (object) => {
	const inString = JSON.stringify(object);
	const inBuffer = binaryStringToArrayBuffer(inString);

	// this does not need to be cryptographically secure, SHA-1 is fine
	const outBuffer = await crypto.subtle.digest('SHA-1', inBuffer);
	const outBinString = arrayBufferToBinaryString(outBuffer);
	const res = btoa(outBinString);

	return res;
};
