import { type ComponentProps, type JSX, createSignal } from 'solid-js';

import { closeModal, openModal } from '~/com/globals/modals.tsx';

import { DialogRoot } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import ColorLensIcon from '~/com/icons/baseline-color-lens.tsx';
import FilterAltIcon from '~/com/icons/baseline-filter-alt.tsx';
import LanguageIcon from '~/com/icons/baseline-language.tsx';
import PeopleIcon from '~/com/icons/baseline-people.tsx';
import PersonOffIcon from '~/com/icons/baseline-person-off.tsx';
import VisibilityIcon from '~/com/icons/baseline-visibility.tsx';

import DonationDialog from '../DonationDialog.tsx';

import {
	type RouterState,
	type View,
	ViewType,
	RouterContext,
	useViewRouter,
} from './settings-views/_router.tsx';
import SettingsRouterView from './settings-views/SettingsRouterView.tsx';

const SettingsDialog = () => {
	const [view, setView] = createSignal<View>({ type: ViewType.ACCOUNTS });

	const router: RouterState = {
		get current() {
			return view();
		},
		navigate: (next) => {
			setView(next);
		},
	};

	return (
		<RouterContext.Provider value={router}>
			<DialogOverlay>
				<div class={/* @once */ DialogRoot({ size: 'xl', fullHeight: true, class: 'max-h-141' })}>
					<div class="flex min-w-0 grow overflow-hidden">
						<div class="flex w-60 shrink-0 flex-col">
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
								<SideItem to={ViewType.ACCOUNTS} icon={PeopleIcon}>
									Accounts
								</SideItem>
								<SideItem to={ViewType.APPEARANCE} icon={ColorLensIcon}>
									Appearance
								</SideItem>
								<SideItem to={ViewType.LANGAUGE} icon={LanguageIcon}>
									Language
								</SideItem>
								<SideItem to={ViewType.CONTENT_FILTERS} icon={VisibilityIcon}>
									Content filters
								</SideItem>
								<SideItem to={ViewType.KEYWORD_FILTERS} icon={FilterAltIcon}>
									Keyword filters
								</SideItem>
								<SideItem to={ViewType.USER_FILTERS} icon={PersonOffIcon}>
									User filters
								</SideItem>
							</div>
							<div class="flex min-w-0 items-center gap-4 p-4">
								<button
									onClick={() => {
										openModal(() => <DonationDialog />);
									}}
									class="text-sm text-accent hover:underline"
								>
									Donate
								</button>
								<div class="grow"></div>
								<button class="font-mono text-xs text-muted-fg hover:underline">trunk/aae1da5</button>
							</div>
						</div>
						<div class="grow overflow-hidden overflow-y-auto border-l border-divider">
							<SettingsRouterView />
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

const SideItem = (props: { icon?: IconComponent; to: ViewType; children: JSX.Element }) => {
	const router = useViewRouter();

	return (
		<button
			onClick={() => {
				router.navigate({ type: props.to });
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
