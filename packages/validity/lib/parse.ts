import type { Output, ValidationIssue, Validator } from './types.ts';

type ParseResult<T> = { ok: true; value: T } | { ok: false; issue: ValidationIssue };

export const parse = <TValidator extends Validator>(
	validate: TValidator,
	value: unknown,
): ParseResult<Output<TValidator>> => {
	const result = validate(value, { path: undefined });

	if (result === true) {
		return { ok: true, value };
	}

	if (result.code === 'ok') {
		return { ok: true, value: result.value };
	}

	return { ok: false, issue: result };
};
