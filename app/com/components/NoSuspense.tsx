// @ts-nocheck
// currently not in use

// this is fucking cursed, is there no other way for me to do this?

import { type JSX, getSuspenseContext } from 'solid-js';

export interface NoSuspenseProps {
	children?: JSX.Element;
}

const NoSuspense = (props: NoSuspenseProps) => {
	const SuspenseContext = getSuspenseContext();

	// turn this shit off
	return SuspenseContext.Provider({
		value: undefined,
		get children() {
			return props.children;
		},
	});
};

export default NoSuspense;
