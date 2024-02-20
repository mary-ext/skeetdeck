import type { Input, Output, ValidationIssue, Validator } from '../types.ts';
import { pushPath } from '../utils.ts';

export type ArrayValidator<TShape extends Validator> = Validator<Input<TShape>[], Output<TShape>[]>;

export const array = <TShape extends Validator>(shape: TShape): ArrayValidator<TShape> => {
	return (array, info) => {
		if (!Array.isArray(array)) {
			return { code: 'invalid_type', path: info.path, expected: 'array' };
		}

		const len = array.length;

		const values: Output<TShape>[] = new Array(len);
		const issues: ValidationIssue[] = [];

		let issued = false;
		let tampered = false;

		for (let idx = 0; idx < len; idx++) {
			const value = array[idx];

			const result = shape(value, { ...info, path: pushPath(info.path, idx) });

			if (result === true) {
				values[idx] = value;
			} else if (result.code === 'ok') {
				tampered = true;
				values[idx] = result.value;
			} else {
				issued = true;
				issues.push(result);
			}
		}

		if (issued) {
			return { code: 'invalid_array', path: info.path, issues };
		}

		if (tampered) {
			return { code: 'ok', value: values };
		}

		return true;
	};
};
