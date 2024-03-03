import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';

import type { At } from '../atp-schema';
import { MultiagentError } from '../classes/multiagent';

export const isDid = (value: string): value is At.DID => {
	return value.startsWith('did:');
};

export const getRecordId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

export const getCollectionId = (uri: string) => {
	const first = uri.indexOf('/', 5);
	const second = uri.indexOf('/', first + 1);

	return uri.slice(first + 1, second);
};

export const getRepoId = (uri: string) => {
	const idx = uri.indexOf('/', 5);
	return uri.slice(5, idx);
};

export const getCurrentDate = () => {
	const date = new Date();
	date.setMilliseconds(0);

	return date.toISOString();
};

export const followAbortSignal = (signals: (AbortSignal | undefined)[]) => {
	const controller = new AbortController();
	const own = controller.signal;

	for (let idx = 0, len = signals.length; idx < len; idx++) {
		const signal = signals[idx];

		if (!signal) {
			continue;
		}

		if (signal.aborted) {
			return signal;
		}

		signal.addEventListener('abort', () => controller.abort(signal.reason), { signal: own });
	}

	return own;
};

export const formatXRPCError = (err: XRPCError): string => {
	const name = err.error;
	return (name ? name + ': ' : '') + err.message;
};

export const formatQueryError = (err: unknown): string => {
	if (err instanceof MultiagentError) {
		const msg = err.message;
		const cause = err.cause;

		if (msg === 'INVALID_ACCOUNT') {
			return `Account associated was removed, try switching to another account.`;
		}

		if (cause) {
			err = cause;
		}
	}

	if (err instanceof XRPCError) {
		const error = err.error;

		if (error === 'InvalidToken' || error === 'ExpiredToken') {
			return `Account session is no longer valid, please sign in again.`;
		}

		return formatXRPCError(err);
	}

	return '' + err;
};
