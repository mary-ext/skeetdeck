export type Key = string | symbol | number;

export type PathType = Key[] | undefined;

export type LiteralType = string | number | boolean | bigint;

export type BaseType =
	| null
	| 'array'
	| 'bigint'
	| 'boolean'
	| 'null'
	| 'number'
	| 'object'
	| 'record'
	| 'string'
	| 'symbol'
	| 'undefined';

export type RequirementIssue =
	| { code: 'ends_with'; expected: string }
	| { code: 'length'; min: number; max: number }
	| { code: 'regex'; expected: string }
	| { code: 'starts_with'; expected: string };

export type ValidationIssue =
	| { code: 'custom_error'; path: PathType; message: string; [key: string]: unknown }
	| { code: 'invalid_array'; path: PathType; issues: ValidationIssue[] }
	| { code: 'invalid_literal'; path: PathType; expected: LiteralType }
	| { code: 'invalid_object'; path: PathType; issues: ValidationIssue[] }
	| { code: 'invalid_record'; path: PathType; issues: ValidationInfo[] }
	| { code: 'invalid_type'; path: PathType; expected: BaseType | BaseType[] }
	| { code: 'invalid_union'; path: PathType; issues: ValidationIssue[] }
	| { code: 'requirement_failed'; path: PathType; issue: RequirementIssue };

export type ValidationResult<T> = true | { code: 'ok'; value: T } | ValidationIssue;

export interface ValidationInfo {
	path: Key[] | undefined;
}

export type Validator<TInput = unknown, TOutput = TInput> = ((
	value: unknown,
	info: ValidationInfo,
) => ValidationResult<TOutput>) & { _t?: { i: TInput; o: TOutput } };

export type Reqcuisitor<T> = (value: T) => true | RequirementIssue;

export type Input<TValidator extends Validator> = NonNullable<TValidator['_t']>['i'];

export type Output<TValidator extends Validator> = NonNullable<TValidator['_t']>['o'];
