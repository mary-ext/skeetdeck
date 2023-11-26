import * as fs from 'node:fs';

import fg from 'fast-glob';
import prettier from 'prettier';

const outfile = './lib/atp-schema.ts';

const writers = {
	queries: [],
	procedures: [],
	subscriptions: [],
	objects: [],
	records: [],
};

const wrap = (chunks, prefix, suffix) => {
	return prefix + (chunks.length > 0 ? '\n\t' + chunks.join('\n\t') : '') + '\n' + suffix;
};

const writeJsdoc = (chunks, descriptions) => {
	if (descriptions.length < 1) {
		return;
	}

	let jsdoc = '/**';

	for (let idx = 0, len = descriptions.length; idx < len; idx++) {
		const suffix = idx !== len - 1 && descriptions[idx + 1][0] !== '@';
		jsdoc += `\n * ${descriptions[idx]}${suffix ? ` \\` : ''}`;
	}

	jsdoc += `\n */`;
	chunks.push(jsdoc);
};

const resolveType = (ns, def) => {
	const type = def.type;

	/** @type {string[]} */
	let descs = [];
	let val = 'unknown';

	if (def.description) {
		descs.push(def.description);

		if (def.description.toLowerCase().startsWith('deprecated')) {
			descs.push(`@deprecated`);
		}
	}

	if (type === 'unknown') {
		val = 'unknown';
	} else if (type === 'number' || type === 'integer') {
		val = 'number';

		if (def.minimum !== undefined) {
			descs.push(`Minimum: ${def.minimum}`);
		}

		if (def.maximum !== undefined) {
			descs.push(`Maximum: ${def.maximum}`);
		}

		if (def.default !== undefined) {
			descs.push(`@default ${def.default}`);
		}
	} else if (type === 'boolean') {
		val = 'boolean';

		if (def.default !== undefined) {
			descs.push(`@default ${def.default}`);
		}
	} else if (type === 'string') {
		const known = def.knownValues;
		const format = def.format;

		if (def.minLength !== undefined) {
			descs.push(`Minimum string length: ${def.minLength}`);
		}

		if (def.maxLength !== undefined) {
			descs.push(`Maximum string length: ${def.maxLength}`);
		}

		if (def.maxGraphemes !== undefined) {
			descs.push(`Maximum grapheme length: ${def.maxGraphemes}`);
		}

		if (def.default !== undefined) {
			descs.push(`@default ${JSON.stringify(def.default)}`);
		}

		if (known) {
			val = `${known.map((val) => `'${val}'`).join(' | ')} | (string & {})`;
		} else if (format === 'did') {
			val = 'DID';
		} else if (format === 'cid') {
			val = 'CID';
		} else if (format === 'handle') {
			val = 'Handle';
		} else if (format === 'at-uri') {
			val = 'AtUri';
		} else {
			val = 'string';
		}
	} else if (type === 'array') {
		const { value, descriptions } = resolveType(ns, def.items);

		if (def.minLength !== undefined) {
			descs.push(`Minimum array length: ${def.minimumLength}`);
		}

		if (def.maxLength !== undefined) {
			descs.push(`Maximum array length: ${def.maxLength}`);
		}

		val = `(${value})[]`;
		descs = descs.concat(descriptions);
	} else if (type === 'blob') {
		const accept = def.accept?.map((mime) => `\`${mime.replaceAll('*', '${string}')}\``);
		val = `AtBlob${accept ? `<${accept.join(' | ')}>` : ''}`;
	} else if (type === 'ref') {
		const ref = def.ref;
		val = `RefOf<'${ref[0] === '#' ? ns + ref : ref}'>`;
	} else if (type === 'union') {
		const refs = def.refs.map((ref) => `UnionOf<'${ref[0] === '#' ? ns + ref : ref}'>`);
		val = refs.join(' | ');
	} else if (type === 'object' || type === 'params') {
		const required = def.required;
		const properties = def.properties;

		const chunks = ['{'];

		for (const prop in properties) {
			const optional = !required || !required.includes(prop);
			const { value, descriptions } = resolveType(ns, properties[prop]);

			writeJsdoc(chunks, descriptions);
			chunks.push(`${prop}${optional ? '?' : ''}: ${value};`);
		}

		chunks.push(`}`);
		val = chunks.join('\n');
	} else {
		console.log(`unknown type: ${type}`);
	}

	return { value: val, descriptions: descs };
};

for (const filename of fg.sync('lexicons/**/*.json')) {
	const jsonString = fs.readFileSync(filename);
	const json = JSON.parse(jsonString);

	const ns = json.id;
	const definitions = json.defs;

	for (const key in definitions) {
		const def = definitions[key];
		const type = def.type;

		const nsid = `${ns}${key !== 'main' ? `#${key}` : ''}`;

		if (type === 'token') {
			const chunks = writers.objects;

			chunks.push(`'${nsid}': '${nsid}';`);
		} else if (type === 'record') {
			const chunks = writers.records;
			const { value, descriptions } = resolveType(ns, def.record);

			writeJsdoc(chunks, def.description ? [def.description].concat(descriptions) : descriptions);
			chunks.push(`'${nsid}': ${value}`);
		} else if (type === 'query' || type === 'procedure') {
			const chunks = type === 'query' ? writers.queries : writers.procedures;

			/** @type {string[]} */
			const descs = [];

			const parameters = def.parameters;
			const input = def.input;
			const output = def.output;
			const errors = def.errors;

			if (def.description) {
				descs.push(def.description);

				if (def.description.toLowerCase().startsWith('deprecated')) {
					descs.push(`@deprecated`);
				}
			}

			writeJsdoc(chunks, descs);
			chunks.push(`'${nsid}': {`);

			if (parameters && Object.keys(parameters.properties).length > 0) {
				const { value, descriptions } = resolveType(ns, parameters);

				writeJsdoc(chunks, descriptions);
				chunks.push(`params: ${value};`);
			}

			if (input) {
				if (input.encoding === 'application/json') {
					const { value, descriptions } = resolveType(ns, input.schema);

					writeJsdoc(chunks, descriptions);
					chunks.push(`data: ${value};`);
				} else {
					chunks.push(`data: Blob;`);
				}
			}

			if (output) {
				if (output.encoding === 'application/json') {
					const { value, descriptions } = resolveType(ns, output.schema);

					writeJsdoc(chunks, descriptions);
					chunks.push(`response: ${value};`);
				} else {
					chunks.push(`response: unknown;`);
				}
			}

			if (errors) {
				chunks.push(`errors: {`);

				for (const error of errors) {
					chunks.push(`${error.name}: {};`);
				}

				chunks.push(`};`);
			}

			chunks.push('};');
		} else if (type === 'subscription') {
			console.log(`unhandled subscription: ${nsid}`);
		} else {
			const chunks = writers.objects;
			const { value, descriptions } = resolveType(ns, def);

			writeJsdoc(chunks, descriptions);
			chunks.push(`'${nsid}': ${value};`);
		}
	}
}

const result = `// This file is automatically generated, do not edit!
// Run scripts/generate-atp-schema.js to update this file.

export type CID = string;

export type DID = \`did:\${string}\`;

export type Handle = string;

export type AtUri = string;

export type AtIdentifier = AtUri | Handle;

export interface AtBlob<T extends string = string> {
	$type: 'blob';
	mimeType: T;
	ref: {
		$link: string;
	};
	size: number;
}

export type ResponseOf<K extends keyof Queries | keyof Procedures> = K extends keyof Queries
	? Queries[K] extends { response: any }
		? Queries[K]['response']
		: unknown
	: K extends keyof Procedures
	? Procedures[K] extends { response: any }
		? Procedures[K]['response']
		: unknown
	: never;

export type RefOf<K extends keyof Objects> = Objects[K];
export type UnionOf<K extends keyof Objects> = Objects[K] & { $type: K };

${wrap(writers.queries, 'export interface Queries {', '}')}

${wrap(writers.procedures, 'export interface Procedures {', '}')}

${wrap(writers.subscriptions, 'export interface Subscriptions {', '}')}

${wrap(writers.objects, 'export interface Objects {', '}')}

${wrap(writers.records, 'export interface Records {', '}')}
`;

console.log(`running prettier`);
const config = await prettier.resolveConfig(outfile);
const formatted = await prettier.format(result, { ...config, parser: 'babel-ts' });

fs.writeFileSync(outfile, formatted);
