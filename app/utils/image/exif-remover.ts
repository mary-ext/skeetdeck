export const removeExif = (buf: ArrayBuffer) => {
	const view = new DataView(buf);
	const indices: [start: number, end: number][] = [];

	let start = 0;

	if (view.byteLength >= 2 && view.getUint16(0) === 0xffd8) {
		// JPEG
		let pos = 2;

		while (pos + 4 + 5 <= view.byteLength) {
			const marker = view.getUint16(pos);

			if (/* Fill */ marker === 0xffff) {
				pos++;

				continue;
			} else if (
				/* App0..App15 */ (marker >= 0xffe0 && marker <= 0xffef) ||
				/* Comment */ marker === 0xfffe ||
				/* SOF0 */ marker === 0xffc0 ||
				/* SOF2 */ marker === 0xffc2 ||
				/* DHT */ marker === 0xffc4 ||
				/* DQT */ marker === 0xffdb ||
				/* DRI */ marker === 0xffdd ||
				/* SOS */ marker === 0xffda
			) {
				const flen = view.getUint16(pos + 2);
				const end = pos + 2 + flen;

				if (
					/* App1 */ marker === 0xffe1 &&
					/* Exif */ view.getUint32(pos + 4) === 0x45786966 &&
					/* null */ view.getUint16(pos + 8) === 0x0
				) {
					indices.push([start, pos]);
					start = end;
				}

				pos = end;
				continue;
			}

			break;
		}
	} else if (view.byteLength >= 8 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
		// PNG
		let pos = 8;

		while (pos + 4 + 4 <= view.byteLength) {
			const flen = view.getUint32(pos);
			const marker = view.getUint32(pos + 4);

			const end = pos + flen + 4 + 4 + 4;

			if (
				/* eXIf */ marker === 0x65584966 ||
				/* tIME */ marker === 0x74494d45 ||
				/* iTXt */ marker === 0x69545874 ||
				/* tEXt */ marker === 0x74455874 ||
				/* zTXT */ marker === 0x7a545874 ||
				/* dSIG */ marker === 0x64534947
			) {
				indices.push([start, pos]);
				start = end;
			}

			pos = end;
		}
	}

	if (start === 0) {
		return null;
	}

	const uint8 = new Uint8Array(buf);
	const copy = new Uint8Array(
		indices.reduce((accu, index) => accu + (index[1] - index[0]), view.byteLength - start),
	);

	copy.set(
		uint8.subarray(start),
		indices.reduce((offset, index) => {
			copy.set(uint8.subarray(index[0], index[1]), offset);
			return offset + (index[1] - index[0]);
		}, 0),
	);

	return buf;
};
