import { type Component, type JSX, lazy } from 'solid-js';

import {
	type ViewType,
	VIEW_ABOUT,
	VIEW_ACCESSIBILITY,
	VIEW_ACCOUNTS,
	VIEW_ADDITIONAL_LANGUAGE,
	VIEW_APPEARANCE,
	VIEW_CONTENT_FILTERS,
	VIEW_EXCLUDED_TRANSLATION,
	VIEW_HIDDEN_REPOSTERS,
	VIEW_KEYWORD_FILTER_FORM,
	VIEW_KEYWORD_FILTERS,
	VIEW_LABEL_CONFIG,
	VIEW_LANGAUGE,
	VIEW_SUBSCRIBED_LABELERS,
	VIEW_TEMPORARY_MUTES,
	useViewRouter,
} from './_router';

const AboutView = lazy(() => import('./AboutView'));
const AccessibilityView = lazy(() => import('./AccessibilityView'));
const AccountsView = lazy(() => import('./AccountsView'));
const AppearanceView = lazy(() => import('./AppearanceView'));
const ContentFiltersView = lazy(() => import('./ContentFiltersView'));
const KeywordFiltersView = lazy(() => import('./KeywordFiltersView'));
const LanguageView = lazy(() => import('./LanguageView'));

const HiddenRepostersView = lazy(() => import('./content-filters/HiddenRepostersView'));
const LabelConfigView = lazy(() => import('./content-filters/LabelConfigView'));
const SubscribedLabelersView = lazy(() => import('./content-filters/SubscribedLabelersView'));
const TemporaryMutesView = lazy(() => import('./content-filters/TemporaryMutesView'));

const KeywordFilterFormView = lazy(() => import('./keyword-filters/KeywordFilterFormView'));

const AdditionalLanguageView = lazy(() => import('./languages/AdditionalLanguageView'));
const ExcludedTranslationView = lazy(() => import('./languages/ExcludedTranslationView'));

const views: Record<ViewType, Component> = {
	[VIEW_ABOUT]: AboutView,
	[VIEW_ACCESSIBILITY]: AccessibilityView,
	[VIEW_ACCOUNTS]: AccountsView,
	[VIEW_APPEARANCE]: AppearanceView,
	[VIEW_CONTENT_FILTERS]: ContentFiltersView,
	[VIEW_KEYWORD_FILTERS]: KeywordFiltersView,
	[VIEW_LANGAUGE]: LanguageView,

	[VIEW_HIDDEN_REPOSTERS]: HiddenRepostersView,
	[VIEW_LABEL_CONFIG]: LabelConfigView,
	[VIEW_SUBSCRIBED_LABELERS]: SubscribedLabelersView,
	[VIEW_TEMPORARY_MUTES]: TemporaryMutesView,

	[VIEW_KEYWORD_FILTER_FORM]: KeywordFilterFormView,

	[VIEW_ADDITIONAL_LANGUAGE]: AdditionalLanguageView,
	[VIEW_EXCLUDED_TRANSLATION]: ExcludedTranslationView,
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
