/**
 * This is used as our store's prototypes to prevent:
 * 1. Being wrapped in a Solid.js store
 * 2. Marked for structural sharing in @tanstack/query
 */
export const proto = {
	constructor: () => {
		throw new Error(`Illegal invocation`);
	},
};
