const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type Headers = Record<string, string>;
export type QueryParams = Record<string, any>;

export class XRPCResponse<T = any> {
	success = true;

	constructor(
		public data: T,
		public headers: Headers,
	) {}
}

export class XRPCError extends Error {
	success = false;
	headers?: Headers;

	constructor(
		public status: ResponseType,
		public error?: string,
		message?: string,
		headers?: Headers,
	) {
		super(message || error);
		this.name = 'XRPCError';
		this.headers = headers;
	}
}

export enum ResponseType {
	Unknown = 1,
	InvalidResponse = 2,
	Success = 200,
	InvalidRequest = 400,
	AuthRequired = 401,
	Forbidden = 403,
	XRPCNotSupported = 404,
	PayloadTooLarge = 413,
	RateLimitExceeded = 429,
	InternalServerError = 500,
	MethodNotImplemented = 501,
	UpstreamFailure = 502,
	NotEnoughResouces = 503,
	UpstreamTimeout = 504,
}

export const httpResponseCodeToEnum = (status: number): ResponseType => {
	if (status in ResponseType) {
		return status;
	} else if (status >= 100 && status < 200) {
		return ResponseType.XRPCNotSupported;
	} else if (status >= 200 && status < 300) {
		return ResponseType.Success;
	} else if (status >= 300 && status < 400) {
		return ResponseType.XRPCNotSupported;
	} else if (status >= 400 && status < 500) {
		return ResponseType.InvalidRequest;
	} else {
		return ResponseType.InternalServerError;
	}
};

export const constructMethodCallUri = (
	nsid: string,
	serviceUri: URL | string,
	params?: QueryParams,
): string => {
	const uri = new URL(`/xrpc/${nsid}`, serviceUri);

	// given parameters
	if (params) {
		for (const key in params) {
			const value = params[key];

			if (value !== undefined) {
				if (Array.isArray(value)) {
					for (let idx = 0, len = value.length; idx < len; idx++) {
						const val = value[idx];
						uri.searchParams.append(key, val);
					}
				} else {
					uri.searchParams.set(key, value);
				}
			}
		}
	}

	return uri.toString();
};

export const constructMethodCallHeaders = (
	headers: Headers,
	method: 'post' | 'get',
	data?: any,
	encoding?: string,
): Headers => {
	if (method === 'post') {
		if (data && typeof data === 'object') {
			if (!headers['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}
		}

		if (encoding) {
			headers['Content-Type'] = encoding;
		}
	}

	return headers;
};

export const encodeMethodCallBody = (headers: Headers, data?: any): ArrayBuffer | Blob | undefined => {
	if (!headers['Content-Type'] || typeof data === 'undefined') {
		return undefined;
	}

	if (data instanceof ArrayBuffer || data instanceof Blob) {
		return data;
	}

	if (headers['Content-Type'].startsWith('text/')) {
		return encoder.encode(data.toString());
	}

	if (headers['Content-Type'].startsWith('application/json')) {
		return encoder.encode(JSON.stringify(data));
		// return encoder.encode(stringifyLex(data));
	}

	return data;
};

export const httpResponseBodyParse = (mimeType: string | null, data: ArrayBuffer | undefined): any => {
	if (mimeType) {
		if (mimeType.includes('application/json') && data?.byteLength) {
			try {
				const str = decoder.decode(data);
				return JSON.parse(str);
			} catch (e) {
				throw new XRPCError(ResponseType.InvalidResponse, `Failed to parse response body: ${String(e)}`);
			}
		}

		if (mimeType.startsWith('text/') && data?.byteLength) {
			try {
				return decoder.decode(data);
			} catch (e) {
				throw new XRPCError(ResponseType.InvalidResponse, `Failed to parse response body: ${String(e)}`);
			}
		}
	}

	if (data instanceof ArrayBuffer) {
		return new Uint8Array(data);
	}

	return data;
};
