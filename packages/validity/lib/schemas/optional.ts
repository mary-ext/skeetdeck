import type { Input, Output, Validator } from '../types.ts';

export type OptionalValidator<TValidator extends Validator> = Validator<
	Input<TValidator> | undefined,
	Output<TValidator> | undefined
>;

export const optional = <TValidator extends Validator>(
	validate: TValidator,
): OptionalValidator<TValidator> => {
	return (value, info) => {
		return value === undefined ? true : validate(value, info);
	};
};
