import { type Component, type JSX, lazy } from 'solid-js';

import {
	type ViewType,
	VIEW_ACCESSIBILITY,
	VIEW_ACCOUNTS,
	VIEW_ADDITIONAL_LANGUAGE,
	VIEW_APPEARANCE,
	VIEW_CONTENT_FILTERS,
	VIEW_KEYWORD_FILTER_FORM,
	VIEW_KEYWORD_FILTERS,
	VIEW_LABEL_CONFIG,
	VIEW_LANGAUGE,
	VIEW_SUBSCRIBED_LABELERS,
	useViewRouter,
} from './_router.tsx';

const AccessibilityView = lazy(() => import('./AccessibilityView.tsx'));
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
	[VIEW_ACCESSIBILITY]: AccessibilityView,
	[VIEW_ACCOUNTS]: AccountsView,
	[VIEW_APPEARANCE]: AppearanceView,
	[VIEW_CONTENT_FILTERS]: ContentFiltersView,
	[VIEW_KEYWORD_FILTERS]: KeywordFiltersView,
	[VIEW_LANGAUGE]: LanguageView,

	[VIEW_LABEL_CONFIG]: LabelConfigView,
	[VIEW_SUBSCRIBED_LABELERS]: SubscribedLabelersView,

	[VIEW_KEYWORD_FILTER_FORM]: KeywordFilterFormView,

	[VIEW_ADDITIONAL_LANGUAGE]: AdditionalLanguageView,
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
