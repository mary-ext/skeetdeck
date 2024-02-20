import type { Input, Output, Validator } from '../types.ts';

export type NullableValidator<TValidator extends Validator, TOutput = Output<TValidator> | null> = Validator<
	Input<TValidator> | null,
	TOutput
>;

export const nullable = <TValidator extends Validator>(
	validate: TValidator,
): NullableValidator<TValidator> => {
	return (value, info) => {
		return value === null ? true : validate(value, info);
	};
};
