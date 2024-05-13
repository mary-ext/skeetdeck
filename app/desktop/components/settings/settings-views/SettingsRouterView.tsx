import { lazy, type Component } from 'solid-js';

import {
	VIEW_ABOUT,
	VIEW_ACCOUNTS,
	VIEW_ACCOUNT_CONFIG,
	VIEW_ADDITIONAL_LANGUAGE,
	VIEW_CONTENT,
	VIEW_EXCLUDED_TRANSLATION,
	VIEW_HIDDEN_REPOSTERS,
	VIEW_INTERFACE,
	VIEW_KEYWORD_FILTERS,
	VIEW_KEYWORD_FILTER_FORM,
	VIEW_LABELER_CONFIG,
	VIEW_LABELER_POPULAR,
	VIEW_MODERATION,
	VIEW_TEMPORARY_MUTES,
	type View,
	type ViewType,
} from './_router';

const AboutView = lazy(() => import('./AboutView'));
const AccountsView = lazy(() => import('./AccountsView'));
const ContentView = lazy(() => import('./ContentView'));
const InterfaceView = lazy(() => import('./InterfaceView'));
const KeywordFiltersView = lazy(() => import('./KeywordFiltersView'));
const ModerationView = lazy(() => import('./ModerationView'));

const AccountConfigView = lazy(() => import('./account/AccountConfigView'));

const HiddenRepostersView = lazy(() => import('./content-filters/HiddenRepostersView'));
const LabelerConfigView = lazy(() => import('./content-filters/LabelerConfigView'));
const LabelerPopularView = lazy(() => import('./content-filters/LabelerPopularView'));
const TemporaryMutesView = lazy(() => import('./content-filters/TemporaryMutesView'));

const KeywordFilterFormView = lazy(() => import('./keyword-filters/KeywordFilterFormView'));

const AdditionalLanguageView = lazy(() => import('./languages/AdditionalLanguageView'));
const ExcludedTranslationView = lazy(() => import('./languages/ExcludedTranslationView'));

const views: Record<ViewType, Component> = {
	[VIEW_ABOUT]: AboutView,
	[VIEW_ACCOUNTS]: AccountsView,
	[VIEW_INTERFACE]: InterfaceView,
	[VIEW_MODERATION]: ModerationView,
	[VIEW_KEYWORD_FILTERS]: KeywordFiltersView,
	[VIEW_CONTENT]: ContentView,

	[VIEW_ACCOUNT_CONFIG]: AccountConfigView,

	[VIEW_HIDDEN_REPOSTERS]: HiddenRepostersView,
	[VIEW_LABELER_CONFIG]: LabelerConfigView,
	[VIEW_LABELER_POPULAR]: LabelerPopularView,
	[VIEW_TEMPORARY_MUTES]: TemporaryMutesView,

	[VIEW_KEYWORD_FILTER_FORM]: KeywordFilterFormView,

	[VIEW_ADDITIONAL_LANGUAGE]: AdditionalLanguageView,
	[VIEW_EXCLUDED_TRANSLATION]: ExcludedTranslationView,
};

const SettingsRouterView = ({ view }: { view: View }) => {
	const Component = views[view.type];

	if (Component) {
		return <Component />;
	}
};

export default SettingsRouterView;
