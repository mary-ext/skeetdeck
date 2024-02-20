import type { Input, Output, PathType, Validator } from '../types.ts';

export type Ok<T> = { code: 'ok'; value: T };
export type Err = { code: 'custom_error'; path: PathType; message: string; [key: string]: unknown };

export type ChainResult<T> = Ok<T> | Err;
export type ChainValidator<TInput, TOutput = TInput> = (value: TInput) => ChainResult<TOutput>;

export const ok = <T>(value: T): Ok<T> => {
	return { code: 'ok', value };
};

export const err = (message: string): Err => {
	return { code: 'custom_error', path: undefined, message };
};

export const chain = <TValidator extends Validator, TOutput>(
	validate: TValidator,
	chain: ChainValidator<Output<TValidator>, TOutput>,
): Validator<Input<TValidator>, TOutput> => {
	return (value, info) => {
		const result = validate(value, info);

		if (result === true || result.code === 'ok') {
			const val = chain(result === true ? value : result.value);

			if (val.code === 'ok' && val.value === value) {
				return true;
			} else if (val.code === 'custom_error') {
				val.path = info.path;
			}

			return val;
		}

		return result;
	};
};
