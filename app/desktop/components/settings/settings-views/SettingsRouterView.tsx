import type { Component, JSX } from 'solid-js';

import { ViewType, useViewRouter } from './_router.tsx';

import AccountsView from './AccountsView.tsx';
import AppearanceView from './AppearanceView.tsx';
import ContentFiltersView from './ContentFiltersView.tsx';
import LanguageView from './LanguageView.tsx';

import LabelConfigView from './content-filters/LabelConfigView.tsx';
import SubscribedLabelersView from './content-filters/SubscribedLabelersView.tsx';

import AdditionalLanguageView from './languages/AdditionalLanguageView.tsx';

// @ts-expect-error
const views: Record<ViewType, Component<any>> = {
	[ViewType.ACCOUNTS]: AccountsView,
	[ViewType.APPEARANCE]: AppearanceView,
	[ViewType.CONTENT_FILTERS]: ContentFiltersView,
	[ViewType.LANGAUGE]: LanguageView,

	[ViewType.LABEL_CONFIG]: LabelConfigView,
	[ViewType.SUBSCRIBED_LABELERS]: SubscribedLabelersView,

	[ViewType.ADDITIONAL_LANGUAGE]: AdditionalLanguageView,
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
