import { type JSX, createMemo } from 'solid-js';

import type { Middleware } from '@floating-ui/dom';
import { getSide } from '@floating-ui/utils';

import {
	type LabelDefinition,
	type LabelPreference,
	PreferenceHide,
	PreferenceWarn,
	PreferenceIgnore,
	getLocalizedLabel,
} from '~/api/moderation';

import { clsx } from '~/utils/misc';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down';
import CheckIcon from '~/com/icons/baseline-check';

import { ListBoxItemReadonly } from '../../_styles';
import InfoOutlinedIcon from '~/com/icons/outline-info';

export interface LabelItemProps {
	def: LabelDefinition;
	value: LabelPreference | undefined;
	showDefault?: boolean;
	global?: boolean;
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
			<button disabled={props.global} class={ListBoxItemReadonly}>
				<div class="flex min-w-0 grow flex-col text-sm">
					<div class="flex justify-between gap-3">
						<span class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
							{/* @once */ locale.n}
						</span>

						<span class="flex min-w-0 shrink-0 items-center gap-0.5 self-start text-muted-fg">
							<span class="text-de">{renderValue(value(), def.d)}</span>
							<ArrowDropDownIcon class={clsx(['-mr-1 text-base', props.global && `hidden`])} />
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
							<span class="grow">{renderValue(value, def.d)}</span>

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
						{/* @once */ item(PreferenceWarn)}
						{/* @once */ item(PreferenceHide)}
					</div>
				);
			}}
		</Flyout>
	);
};

const renderValue = (value: LabelPreference | undefined, defaultValue?: LabelPreference): string => {
	if (value === PreferenceHide) {
		return `Hide`;
	}

	if (value === PreferenceWarn) {
		return `Warn`;
	}

	if (value === PreferenceIgnore) {
		return `Show`;
	}

	if (defaultValue !== undefined) {
		return `Default (${renderValue(defaultValue)})`;
	}

	return `Unknown`;
};
