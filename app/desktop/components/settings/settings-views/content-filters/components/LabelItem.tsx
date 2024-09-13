import type { Middleware } from '@floating-ui/dom';
import { getSide } from '@floating-ui/utils';
import { type JSX, createMemo } from 'solid-js';

import {
	BlurContent,
	BlurMedia,
	BlurNone,
	type LabelDefinition,
	type LabelPreference,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
	SeverityAlert,
	SeverityInform,
	SeverityNone,
	getLocalizedLabel,
} from '~/api/moderation';

import { clsx } from '~/utils/misc';

import { ListBoxItemReadonly } from '~/com/primitives/list-box';
import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';
import CheckIcon from '~/com/icons/baseline-check';
import InfoOutlinedIcon from '~/com/icons/outline-info';

export interface LabelItemProps {
	def: LabelDefinition;
	value: LabelPreference | undefined;
	showDefault?: boolean;
	global?: boolean;
	disabled?: boolean;
	onChange: (next: LabelPreference | undefined) => void;
}

const LabelItem = (props: LabelItemProps) => {
	const def = props.def;

	const value = createMemo(() => {
		const actual = props.value;
		return actual === undefined && !props.showDefault ? def.d : actual;
	});

	const locale = getLocalizedLabel(def);

	return (
		<LabelItemFlyout {...props} value={value()}>
			<button disabled={props.disabled || props.global} class={ListBoxItemReadonly}>
				<div class="flex min-w-0 grow flex-col text-sm">
					<div class="flex justify-between gap-3">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
							{/* @once */ locale.n}
						</span>

						<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
							<span class="text-de">{renderValueDef(def, value())}</span>

							<ArrowDropDownIcon
								class={clsx(['-mr-1 text-base', (props.disabled || props.global) && `hidden`])}
							/>
						</span>
					</div>
					<p class="mt-1 overflow-hidden text-ellipsis whitespace-pre-wrap text-de text-muted-fg empty:hidden">
						{/* @once */ locale.d}
					</p>

					{props.global && (
						<div class="mt-2 flex items-center gap-2 text-muted-fg">
							<InfoOutlinedIcon />
							<span class="text-de">Configured in moderation settings</span>
						</div>
					)}
				</div>
			</button>
		</LabelItemFlyout>
	);
};

export default LabelItem;

const offsetMiddleware: Middleware = {
	name: 'offset',
	fn(state) {
		const reference = state.rects.reference;
		const x = state.x;
		const y = state.y;

		const multi = getSide(state.placement) === 'bottom' ? 1 : -1;

		return {
			x: x - 16,
			y: y + 12 - reference.height * multi,
		};
	},
};

interface LabelItemFlyoutProps extends LabelItemProps {
	children: JSX.Element;
}

const LabelItemFlyout = (props: LabelItemFlyoutProps) => {
	const onChange = props.onChange;
	const def = props.def;

	const displayWarn = canDisplayWarn(def);

	return (
		<Flyout button={props.children} middleware={[offsetMiddleware, ...offsetlessMiddlewares]}>
			{({ close, menuProps }) => {
				const item = (value: LabelPreference | undefined) => {
					return (
						<button
							onClick={() => {
								close();
								onChange(value);
							}}
							class={/* @once */ MenuItem()}
						>
							<span class="grow">{renderValueDef(def, value)}</span>

							<CheckIcon
								class={clsx([MenuItemIcon(), 'text-accent', value !== props.value && `invisible`])}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						{/* @once */ props.showDefault && item(undefined)}
						{/* @once */ item(PreferenceIgnore)}
						{/* @once */ displayWarn && item(PreferenceWarn)}
						{/* @once */ item(PreferenceHide)}
					</div>
				);
			}}
		</Flyout>
	);
};

const canDisplayWarn = (def: LabelDefinition) => {
	return !(def.b === BlurNone && def.s === SeverityNone);
};

const renderValueDef = (def: LabelDefinition, pref: LabelPreference | undefined): string => {
	if (pref === undefined) {
		return `Default (${renderValueDef(def, def.d)})`;
	}

	if (pref === PreferenceIgnore) {
		return `Off`;
	}
	if (pref === PreferenceHide) {
		return `Hide`;
	}

	if (def.b === BlurContent || def.b === BlurMedia || def.s === SeverityAlert) {
		return `Warn`;
	}

	if (def.s === SeverityInform) {
		return `Inform`;
	}

	return `Unknown`;
};
