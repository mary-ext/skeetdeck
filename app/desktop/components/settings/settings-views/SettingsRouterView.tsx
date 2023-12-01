import type { Component, JSX } from 'solid-js';

import { ViewType, useViewRouter } from './_router.tsx';

import AccountsView from './AccountsView.tsx';

// @ts-expect-error
const views: Record<ViewType, Component<any>> = {
	[ViewType.ACCOUNTS]: AccountsView,
};

const SettingsRouterView = () => {
	const router = useViewRouter();

	return (() => {
		const current = router.current;
		const Component = views[current.type];

		if (Component) {
			return <Component {...current} />;
		}
	}) as unknown as JSX.Element;
};

export default SettingsRouterView;
