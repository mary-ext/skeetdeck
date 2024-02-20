import type { Input, Output, ValidationIssue, Validator } from '../types.ts';

export type UnionOptions = [Validator<any>, Validator<any>, ...Validator<any>[]];

export type UnionValidator<TOptions extends UnionOptions, TOutput = Output<TOptions[number]>> = Validator<
	Input<TOptions[number]>,
	TOutput
>;

export const union = <TOptions extends UnionOptions>(...options: TOptions): UnionValidator<TOptions> => {
	const len = options.length;

	return (value, info) => {
		const issues: ValidationIssue[] = [];

		for (let idx = 0; idx < len; idx++) {
			const validate = options[idx];
			const result = validate(value, info);

			if (result === true || result.code === 'ok') {
				return result;
			}

			issues.push(result);
		}

		return { code: 'invalid_union', path: info.path, issues: issues };
	};
};
