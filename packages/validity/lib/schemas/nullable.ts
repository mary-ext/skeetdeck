import type { Input, Output, Validator } from '../types.ts';

export type NullableValidator<TValidator extends Validator> = Validator<
	Input<TValidator> | null,
	Output<TValidator> | null
>;

export const nullable = <TValidator extends Validator>(
	validate: TValidator,
): NullableValidator<TValidator> => {
	return (value, info) => {
		return value === null ? true : validate(value, info);
	};
};
