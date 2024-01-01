import { type ComponentProps, type JSX, createSignal, Suspense } from 'solid-js';

import { closeModal, openModal } from '~/com/globals/modals.tsx';

import { DialogRoot } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';

import AccessibilityIcon from '~/com/icons/baseline-accessibility.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';
import ColorLensIcon from '~/com/icons/baseline-color-lens.tsx';
import FilterAltIcon from '~/com/icons/baseline-filter-alt.tsx';
import LanguageIcon from '~/com/icons/baseline-language.tsx';
import PeopleIcon from '~/com/icons/baseline-people.tsx';
import VisibilityIcon from '~/com/icons/baseline-visibility.tsx';

import {
	type RouterState,
	type View,
	type ViewType,
	RouterContext,
	VIEW_ACCESSIBILITY,
	VIEW_ACCOUNTS,
	VIEW_APPEARANCE,
	VIEW_CONTENT_FILTERS,
	VIEW_KEYWORD_FILTERS,
	VIEW_LANGAUGE,
	useViewRouter,
} from './settings-views/_router.tsx';
import SettingsRouterView from './settings-views/SettingsRouterView.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';

const DONATION_LINK = 'https://github.com/mary-ext/langit/wiki/Donation';

const GIT_SOURCE = import.meta.env.VITE_GIT_SOURCE;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT;
const GIT_BRANCH = import.meta.env.VITE_GIT_BRANCH;

const SettingsDialog = () => {
	const [view, setView] = createSignal<View>({ type: VIEW_ACCOUNTS });

	const router: RouterState = {
		get current() {
			return view();
		},
		move: (next) => {
			setView(next);
		},
	};

	return (
		<RouterContext.Provider value={router}>
			<DialogOverlay>
				<div class={/* @once */ DialogRoot({ size: 'xl', fullHeight: true, maxHeight: 'sm' })}>
					<div class="flex min-w-0 grow overflow-hidden">
						<div class="flex w-60 shrink-0 flex-col bg-secondary/10">
							<div class="flex h-13 min-w-0 shrink-0 items-center gap-2 px-4">
								<button
									onClick={closeModal}
									title="Close dialog"
									class={/* @once */ IconButton({ edge: 'left' })}
								>
									<CloseIcon />
								</button>
							</div>
							<div class="flex grow flex-col overflow-y-auto">
								<SideItem to={VIEW_ACCOUNTS} icon={PeopleIcon}>
									Accounts
								</SideItem>
								<SideItem to={VIEW_APPEARANCE} icon={ColorLensIcon}>
									Appearance
								</SideItem>
								<SideItem to={VIEW_ACCESSIBILITY} icon={AccessibilityIcon}>
									Accessibility
								</SideItem>
								<SideItem to={VIEW_LANGAUGE} icon={LanguageIcon}>
									Language
								</SideItem>
								<SideItem to={VIEW_CONTENT_FILTERS} icon={VisibilityIcon}>
									Content filters
								</SideItem>
								<SideItem to={VIEW_KEYWORD_FILTERS} icon={FilterAltIcon}>
									Keyword filters
								</SideItem>
							</div>
							<div class="flex min-w-0 items-center gap-4 p-4">
								<a target="_blank" href={DONATION_LINK} class="text-sm text-accent hover:underline">
									Donate
								</a>
								<div class="grow"></div>
								<a target="_blank" href={GIT_SOURCE} class="font-mono text-xs text-muted-fg hover:underline">
									{/* @once */ GIT_COMMIT ? `${GIT_BRANCH}/${GIT_COMMIT}` : `indev`}
								</a>
							</div>
						</div>
						<div class="flex grow flex-col overflow-hidden overflow-y-auto border-l border-divider">
							<Suspense
								fallback={
									<div class="grid grow place-items-center">
										<CircularProgress />
									</div>
								}
							>
								<SettingsRouterView />
							</Suspense>
						</div>
					</div>
				</div>
			</DialogOverlay>
		</RouterContext.Provider>
	);
};

export default SettingsDialog;

const sideItem = Interactive({
	variant: 'muted',
	class: `flex shrink-0 items-center gap-4 px-4 py-3 text-left text-sm disabled:opacity-50`,
});

type IconComponent = (props: ComponentProps<'svg'>) => JSX.Element;

type Exactly<T, U extends T> = { [K in keyof U]: K extends keyof T ? T[K] : never };
type StandaloneViews<V extends { type: ViewType } = View> = V extends Exactly<{ type: ViewType }, V>
	? V
	: never;

type StandaloneViewType = StandaloneViews['type'];

const SideItem = (props: { icon?: IconComponent; to: StandaloneViewType; children: JSX.Element }) => {
	const router = useViewRouter();

	return (
		<button
			onClick={() => {
				router.move({ type: props.to });
			}}
			class={sideItem}
			classList={{ [`bg-secondary/20`]: router.current.type === props.to }}
		>
			{(() => {
				const Icon = props.icon;
				if (Icon) {
					return <Icon class="shrink-0 text-lg" />;
				}
			})()}
			<span class="grow">{props.children}</span>
		</button>
	);
};
