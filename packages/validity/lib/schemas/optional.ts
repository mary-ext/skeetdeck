import type { Input, Output, Validator } from '../types.ts';

export type OptionalValidator<
	TValidator extends Validator,
	TOutput = Output<TValidator> | undefined,
> = Validator<Input<TValidator> | undefined, TOutput>;

export const optional = <TValidator extends Validator>(
	validate: TValidator,
): OptionalValidator<TValidator> => {
	return (value, info) => {
		return value === undefined ? true : validate(value, info);
	};
};
