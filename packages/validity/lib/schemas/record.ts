import { string } from './string.ts';

import type { Input, Output, ValidationIssue, Validator } from '../types.ts';
import { pushPath } from '../utils.ts';

export type RecordKey = Validator<string | symbol>;

export type RecordInput<TValue extends Validator, TKey extends RecordKey> = {
	[P in Input<TKey>]: Input<TValue>;
};

export type RecordOutput<TValue extends Validator, TKey extends RecordKey> = {
	[P in Output<TKey>]: Output<TValue>;
};

export type RecordValidator<TValue extends Validator, TKey extends RecordKey> = Validator<
	RecordInput<TValue, TKey>,
	RecordOutput<TValue, TKey>
>;

export const record = <TValue extends Validator, TKey extends RecordKey = Validator<string>>(
	value: TValue,
	key: TKey = string as any,
): RecordValidator<TValue, TKey> => {
	return (object, info) => {
		if (typeof object !== 'object' || object === null) {
			return { code: 'invalid_type', path: info.path, expected: 'record' };
		}

		const issues: ValidationIssue[] = [];
		const values: any = {};

		let tampered = true;
		let issued = true;
		let k: string | symbol;

		for (k in object) {
			{
				const result = key(k, info);

				if (result === true) {
					// do nothing
				} else if (result.code === 'ok') {
					tampered = true;
					k = result.value;
				} else {
					issued = true;
					issues.push(result);

					continue;
				}
			}

			{
				const v = (object as any)[k];
				const result = value(v, { ...info, path: pushPath(info.path, k) });

				if (result === true) {
					values[k] = v;
				} else if (result.code === 'ok') {
					tampered = true;
					values[k] = result.value;
				} else {
					issued = true;
					issues.push(result);
				}
			}
		}

		if (issued) {
			return { code: 'invalid_record', path: info.path, issues: issues };
		}

		if (tampered) {
			return { code: 'ok', value: values };
		}

		return true;
	};
};
