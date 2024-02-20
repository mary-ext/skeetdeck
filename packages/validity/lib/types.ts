export type Key = string | number;

export type PathType = Key[] | undefined;

export type LiteralType = string | number | boolean | bigint;

export type BaseType =
	| null
	| 'string'
	| 'number'
	| 'boolean'
	| 'undefined'
	| 'null'
	| 'object'
	| 'array'
	| 'bigint';

export type RequirementIssue = { code: 'length'; min: number; max: number };

export type ValidationIssue =
	| { code: 'invalid_type'; path: PathType; expected: BaseType }
	| { code: 'invalid_literal'; path: PathType; expected: LiteralType }
	| { code: 'invalid_object'; path: PathType; issues: ValidationIssue[] }
	| { code: 'invalid_array'; path: PathType; issues: ValidationIssue[] }
	| { code: 'invalid_union'; path: PathType; issues: ValidationIssue[] }
	| { code: 'requirement_failed'; path: PathType; issue: RequirementIssue }
	| { code: 'custom_error'; path: PathType; message: string; [key: string]: unknown };

export type ValidationResult<T> = true | { code: 'ok'; value: T } | ValidationIssue;

export interface ValidationInfo {
	path: Key[] | undefined;
}

export type Validator<TInput = unknown, TOutput = TInput> = ((
	value: unknown,
	info: ValidationInfo,
) => ValidationResult<TOutput>) & { _t?: { i: TInput; o: TOutput } };

export type Recquisition<T> = (value: T) => boolean | RequirementIssue;

export type Input<TValidator extends Validator> = NonNullable<TValidator['_t']>['i'];

export type Output<TValidator extends Validator> = NonNullable<TValidator['_t']>['o'];
