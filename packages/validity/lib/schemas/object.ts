import type { Input, Output, ValidationIssue, Validator } from '../types.ts';
import { pushPath } from '../utils.ts';

export type ObjectShape = Record<string, Validator>;

export type ObjectInput<TShape extends ObjectShape, TRest extends Validator | undefined> =
	TRest extends Validator<never>
		? { [TKey in keyof TShape]: Input<TShape[TKey]> }
		: { [TKey in keyof TShape]: Input<TShape[TKey]> } & Record<
				string | symbol,
				TRest extends Validator ? Input<TRest> : unknown
			>;

export type ObjectOutput<TShape extends ObjectShape, TRest extends Validator | undefined> =
	TRest extends Validator<never>
		? { [TKey in keyof TShape]: Output<TShape[TKey]> }
		: { [TKey in keyof TShape]: Output<TShape[TKey]> } & Record<
				string | symbol,
				TRest extends Validator ? Output<TRest> : unknown
			>;

export type ObjectValidator<TShape extends ObjectShape, TRest extends Validator | undefined> = Validator<
	ObjectInput<TShape, TRest>,
	ObjectOutput<TShape, TRest>
>;

export const object = <TShape extends ObjectShape, TRest extends Validator | undefined = undefined>(
	shape: TShape,
	rest?: TRest,
): ObjectValidator<TShape, TRest> => {
	return (object, info) => {
		if (typeof object !== 'object' || object === null) {
			return { code: 'invalid_type', path: info.path, expected: 'object' };
		}

		const issues: ValidationIssue[] = [];
		const values: any = {};

		let issued = false;
		let tampered = false;

		for (const key in shape) {
			const validate = shape[key];
			const value = (object as ObjectInput<TShape, TRest>)[key];

			const result = validate(value, { ...info, path: pushPath(info.path, key) });

			if (result === true) {
				values[key] = value;
			} else if (result.code === 'ok') {
				tampered = true;
				values[key] = result.value;
			} else {
				issued = true;
				issues.push(result);
			}
		}

		if (rest) {
			for (const key in object) {
				if (!(key in shape)) {
					const value = (object as ObjectInput<TShape, TRest>)[key];
					const result = rest(value, { ...info, path: pushPath(info.path, key) });

					if (result === true) {
						values[key] = value;
					} else if (result.code === 'ok') {
						tampered = true;
						values[key] = result.value;
					} else {
						issued = true;
						issues.push(result);
					}
				}
			}
		}

		if (issued) {
			return { code: 'invalid_object', path: info.path, issues: issues };
		}

		if (tampered) {
			return { code: 'ok', value: values };
		}

		return true;
	};
};
