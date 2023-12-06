import type { Component, JSX } from 'solid-js';

import { ViewType, useViewRouter } from './_router.tsx';

import AccountsView from './AccountsView.tsx';
import AppearanceView from './AppearanceView.tsx';
import ContentFiltersView from './ContentFiltersView.tsx';
import KeywordFiltersView from './KeywordFiltersView.tsx';
import LanguageView from './LanguageView.tsx';

import LabelConfigView from './content-filters/LabelConfigView.tsx';
import SubscribedLabelersView from './content-filters/SubscribedLabelersView.tsx';

import KeywordFilterFormView from './keyword-filters/KeywordFilterFormView.tsx';

import AdditionalLanguageView from './languages/AdditionalLanguageView.tsx';

const views: Record<ViewType, Component> = {
	[ViewType.ACCOUNTS]: AccountsView,
	[ViewType.APPEARANCE]: AppearanceView,
	[ViewType.CONTENT_FILTERS]: ContentFiltersView,
	[ViewType.KEYWORD_FILTERS]: KeywordFiltersView,
	[ViewType.LANGAUGE]: LanguageView,

	[ViewType.LABEL_CONFIG]: LabelConfigView,
	[ViewType.SUBSCRIBED_LABELERS]: SubscribedLabelersView,

	[ViewType.KEYWORD_FILTER_FORM]: KeywordFilterFormView,

	[ViewType.ADDITIONAL_LANGUAGE]: AdditionalLanguageView,
};

const SettingsRouterView = () => {
	const router = useViewRouter();

	return (() => {
		const current = router.current;
		const Component = views[current.type];

		if (Component) {
			return <Component />;
		}
	}) as unknown as JSX.Element;
};

export default SettingsRouterView;
