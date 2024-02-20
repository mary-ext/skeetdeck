import type { Input, Output, Reqcuisitor, Validator } from '../types.ts';

export const pipe = <TValidator extends Validator>(
	validate: TValidator,
	requirements: Reqcuisitor<Output<TValidator>>[],
): Validator<Input<TValidator>, Output<TValidator>> => {
	const len = requirements.length;

	return (value, info) => {
		const result = validate(value, info);

		if (result === true || result.code === 'ok') {
			for (let idx = 0; idx < len; idx++) {
				const requisitor = requirements[idx];
				const res = requisitor(value);

				if (res !== true) {
					return { code: 'requirement_failed', path: info.path, issue: res };
				}
			}
		}

		return result;
	};
};
