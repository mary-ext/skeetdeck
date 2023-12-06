import { type JSX, batch } from 'solid-js';

import { type Middleware, flip } from '@floating-ui/dom';

import { renderLabelGroupName, renderLabelName } from '~/api/display.ts';
import { getSide } from '@floating-ui/utils';

import { PreferenceHide, PreferenceIgnore, PreferenceWarn } from '~/api/moderation/enums.ts';
import type { ModerationLabelOpts } from '~/api/moderation/types.ts';

import { assert } from '~/utils/misc.ts';

import { preferences } from '~/desktop/globals/settings.ts';

import { Flyout } from '~/com/components/Flyout.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive } from '~/com/primitives/interactive.ts';
import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import ArrowDropDownIcon from '~/com/icons/baseline-arrow-drop-down.tsx';
import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';

import { type ViewParams, ViewType, useViewRouter } from '../_router.tsx';
import CheckIcon from '~/com/icons/baseline-check.tsx';

interface LabelDef {
	/** Label ID */
	k: string;
	/** Label description */
	d: string;
}

interface LabelGroupDef {
	/** Group ID */
	k: string;
	/** Group description */
	// d: string;
	/** Labels under this group */
	c: LabelDef[];
}

const LABEL_DEFS: LabelGroupDef[] = [
	// system and legal cannot be configured, so there's no point in showing them.

	// {
	// 	k: 'system',
	// 	d: 'Moderator overrides for special cases.',
	// 	c: [],
	// },
	// {
	// 	k: 'legal',
	// 	d: 'Content removed for legal reasons.',
	// 	c: [],
	// },

	{
		k: 'sexual',
		// d: 'Content which is sexual in nature',
		c: [
			{
				k: 'porn',
				d: 'Erotic nudity or explicit sexual activity',
			},
			{
				k: 'sexual',
				d: 'Not pornographic but still sexual in nature',
			},
			{
				k: 'nudity',
				d: 'Artistic or non-erotic nudity',
			},
		],
	},
	{
		k: 'violence',
		// d: 'Content which is violent or deeply disturbing',
		c: [
			{
				k: 'nsfl',
				d: 'General disturbing content',
			},
			{
				k: 'corpse',
				d: 'Images of dead bodies in any context',
			},
			{
				k: 'gore',
				d: 'Shocking images involving blood or visible wounds',
			},
			{
				k: 'torture',
				d: 'Images involving cruelty done to a human or animal',
			},
			{
				k: 'self-harm',
				d: 'Depiction of harmful actions to oneself',
			},
		],
	},
	{
		k: 'intolerance',
		// d: 'Content or behavior which is hateful or intolerant toward a group of people',
		c: [
			{
				k: 'intolerant',
				d: 'General hateful content',
			},
			{
				k: 'intolerant-race',
				d: 'Hateful content about race',
			},
			{
				k: 'intolerant-gender',
				d: 'Hateful content about gender identity',
			},
			{
				k: 'intolerant-sexual-orientation',
				d: 'Hateful content about sexual preferences',
			},
			{
				k: 'intolerant-religion',
				d: 'Hateful content about religious views or practices',
			},
			{
				k: 'icon-intolerant',
				d: 'Imagery of a hate group in any context',
			},
		],
	},
	{
		k: 'rude',
		// d: 'Behavior which is rude toward other users',
		c: [
			{
				k: 'threat',
				d: 'Intentions to threaten, intimidate, or harm others',
			},
		],
	},
	{
		k: 'curation',
		// d: 'Subjective moderation geared towards curating a more positive environment',
		c: [
			{
				k: 'spoiler',
				d: 'Discussion of major plot points in a media',
			},
		],
	},
	{
		k: 'spam',
		// d: "Content which doesn't add to the conversation",
		c: [
			{
				k: 'spam',
				d: 'Low-quality mesasges',
			},
		],
	},
	{
		k: 'misinfo',
		// d: 'Content which misleads or defrauds users',
		c: [
			{
				k: 'account-security',
				d: 'Attempts to hijack user accounts',
			},
			{
				k: 'net-abuse',
				d: 'Attempts to network systems',
			},
			{
				k: 'impersonation',
				d: 'False assertion of identity',
			},
			{
				k: 'scam',
				d: 'Fraudulent content',
			},
		],
	},
];

const LabelConfigView = () => {
	const router = useViewRouter();
	const params = router.current as ViewParams<ViewType.LABEL_CONFIG>;

	const mods = preferences.moderation;

	let title: string;
	let subtitle: string | undefined;
	let description: string | undefined;
	let config: ModerationLabelOpts | undefined;

	if (params.kind === 'global') {
		title = `Content filter preferences`;
		description = `These preferences applies to self-labeled content and any label providers you are subscribed to.`;
		config = mods.globals;
	} else if (params.kind === 'labeler') {
		title = `Label provider preferences`;
		subtitle = `@moderation.bsky.social`;
		description = `These preferences applies to any content that has been labeled by this label provider.`;
		config = mods.labelers[params.did];
	} else {
		assert(false, `unexpected params`);
	}

	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					title="Return to previous screen"
					onClick={() =>
						router.move({
							type: params.kind === 'labeler' ? ViewType.SUBSCRIBED_LABELERS : ViewType.CONTENT_FILTERS,
						})
					}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>

				<div class="grow">
					<h2 class="text-base font-bold leading-5">{title}</h2>
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg empty:hidden">
						{subtitle}
					</p>
				</div>
			</div>
			<div class="flex grow flex-col overflow-y-auto pb-4">
				<p class="px-4 py-3 text-de text-muted-fg empty:hidden">{description}</p>
				{/* @once */ config && renderOptionsScreen(config, params.kind === 'global')}
			</div>
		</div>
	);
};

export default LabelConfigView;

// - Global
//   - Ignore (undefined)
//   - Warn (PreferenceWarn)
//   - Hide (PreferenceHide)
// - Local
//   - Default (undefined)
//   - Ignore (PreferenceIgnore)
//   - Warn (PreferenceWarn)
//   - Hide (PreferenceHide)

const renderValue = (value: number | undefined, global: boolean) => {
	if (value === PreferenceHide) {
		return `Hide`;
	} else if (value === PreferenceWarn) {
		return `Warn`;
	} else if (value === PreferenceIgnore || global) {
		return `Ignore`;
	}

	return `Default`;
};

const labelItem = Interactive({
	class: `flex min-w-0 px-4 py-3 text-left text-sm`,
});

const renderOptionsScreen = (opts: ModerationLabelOpts, global: boolean) => {
	const labels = opts.labels;

	return (
		<div class="flex flex-col gap-3">
			{
				/* @once */ LABEL_DEFS.map((group) => {
					return (
						<div class="flex flex-col">
							<LabelConfigFlyout
								global={global}
								multiple
								onChange={(next) => {
									batch(() => {
										for (const label of group.c) {
											const k = label.k;
											labels[k] = next;
										}
									});
								}}
							>
								<button class={`${labelItem} items-center gap-1`}>
									<span class="text-sm font-bold">{/* @once */ renderLabelGroupName(group.k)}</span>

									<ArrowDropDownIcon class="text-base" />
								</button>
							</LabelConfigFlyout>

							{
								/* @once */ group.c.map((label) => {
									const k = label.k;

									return (
										<LabelConfigFlyout
											global={global}
											value={labels[k]}
											onChange={(next) => {
												labels[k] = next;
											}}
										>
											<button class={`${labelItem} items-start justify-between gap-4 pl-8`}>
												<div>
													<p class="text-sm">{/* @once */ renderLabelName(k)}</p>
													<p class="text-de text-muted-fg">{/* @once */ label.d}</p>
												</div>

												<span class="-mr-1 flex min-w-0 shrink-0 items-center gap-0.5 text-muted-fg">
													<span class="text-de">{renderValue(labels[k], global)}</span>
													<ArrowDropDownIcon class="text-base" />
												</span>
											</button>
										</LabelConfigFlyout>
									);
								})
							}
						</div>
					);
				})
			}
		</div>
	);
};

interface LabelConfigFlyoutProps {
	global?: boolean;
	multiple?: boolean;
	value?: number | undefined;
	onChange: (next: number | undefined) => void;
	children: JSX.Element;
}

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

const LabelConfigFlyout = (props: LabelConfigFlyoutProps) => {
	return (
		<Flyout button={props.children} middleware={[offsetMiddleware, flip()]}>
			{({ close, menuProps }) => {
				const renderItem = (value: number | undefined, title: string, subtitle?: string) => {
					return (
						<button
							onClick={() => {
								close();
								props.onChange?.(value);
							}}
							class={/* @once */ MenuItem()}
						>
							<div class="grow">
								<p>{title}</p>
								<p class="text-de text-muted-fg empty:hidden">{subtitle}</p>
							</div>

							<CheckIcon
								class="text-xl text-accent"
								classList={{ [`invisible`]: props.multiple || value !== props.value }}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						{/* @once */ !props.global && renderItem(undefined, `Default`, `Inherit from global preference`)}
						{/* @once */ renderItem(!props.global ? PreferenceIgnore : undefined, `Ignore`)}
						{/* @once */ renderItem(PreferenceWarn, `Warn`)}
						{/* @once */ renderItem(PreferenceHide, `Hide`)}
					</div>
				);
			}}
		</Flyout>
	);
};
