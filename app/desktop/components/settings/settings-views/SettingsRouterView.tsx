import { type Component, type JSX, lazy } from 'solid-js';

import { ViewType, useViewRouter } from './_router.tsx';

const AccountsView = lazy(() => import('./AccountsView.tsx'));
const AppearanceView = lazy(() => import('./AppearanceView.tsx'));
const ContentFiltersView = lazy(() => import('./ContentFiltersView.tsx'));
const KeywordFiltersView = lazy(() => import('./KeywordFiltersView.tsx'));
const LanguageView = lazy(() => import('./LanguageView.tsx'));

const LabelConfigView = lazy(() => import('./content-filters/LabelConfigView.tsx'));
const SubscribedLabelersView = lazy(() => import('./content-filters/SubscribedLabelersView.tsx'));

const KeywordFilterFormView = lazy(() => import('./keyword-filters/KeywordFilterFormView.tsx'));

const AdditionalLanguageView = lazy(() => import('./languages/AdditionalLanguageView.tsx'));

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
