import { type Component, type JSX, lazy } from 'solid-js';

import {
	type ViewType,
	VIEW_ABOUT,
	VIEW_ACCESSIBILITY,
	VIEW_ACCOUNT_MODERATION,
	VIEW_ACCOUNTS,
	VIEW_ADDITIONAL_LANGUAGE,
	VIEW_APPEARANCE,
	VIEW_EXCLUDED_TRANSLATION,
	VIEW_HIDDEN_REPOSTERS,
	VIEW_KEYWORD_FILTER_FORM,
	VIEW_KEYWORD_FILTERS,
	VIEW_LABELER_CONFIG,
	VIEW_LANGAUGE,
	VIEW_MODERATION,
	VIEW_TEMPORARY_MUTES,
	useViewRouter,
} from './_router';

const AboutView = lazy(() => import('./AboutView'));
const AccessibilityView = lazy(() => import('./AccessibilityView'));
const AccountsView = lazy(() => import('./AccountsView'));
const AppearanceView = lazy(() => import('./AppearanceView'));
const KeywordFiltersView = lazy(() => import('./KeywordFiltersView'));
const LanguageView = lazy(() => import('./LanguageView'));
const ModerationView = lazy(() => import('./ModerationView'));

const AccountModerationView = lazy(() => import('./moderation/AccountModerationView'))

const HiddenRepostersView = lazy(() => import('./content-filters/HiddenRepostersView'));
const LabelConfigView = lazy(() => import('./content-filters/LabelerConfigView'));
const TemporaryMutesView = lazy(() => import('./content-filters/TemporaryMutesView'));

const KeywordFilterFormView = lazy(() => import('./keyword-filters/KeywordFilterFormView'));

const AdditionalLanguageView = lazy(() => import('./languages/AdditionalLanguageView'));
const ExcludedTranslationView = lazy(() => import('./languages/ExcludedTranslationView'));

const views: Record<ViewType, Component> = {
	[VIEW_ABOUT]: AboutView,
	[VIEW_ACCESSIBILITY]: AccessibilityView,
	[VIEW_ACCOUNTS]: AccountsView,
	[VIEW_APPEARANCE]: AppearanceView,
	[VIEW_MODERATION]: ModerationView,
	[VIEW_KEYWORD_FILTERS]: KeywordFiltersView,
	[VIEW_LANGAUGE]: LanguageView,

	[VIEW_ACCOUNT_MODERATION]: AccountModerationView,

	[VIEW_HIDDEN_REPOSTERS]: HiddenRepostersView,
	[VIEW_LABELER_CONFIG]: LabelConfigView,
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
