import type { JSX } from 'solid-js';

import { flip, shift } from '@floating-ui/dom';

import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout } from '~/com/components/Flyout.tsx';

import CheckIcon from '~/com/icons/baseline-check.tsx';

export interface ContentWarningActionProps {
	labels: string[];
	onChange: (next: string[]) => void;
	children: JSX.Element;
}

const ContentWarningAction = (props: ContentWarningActionProps) => {
	return (
		<Flyout button={props.children} placement="bottom" middleware={[shift({ padding: 16 }), flip()]}>
			{({ close, menuProps }) => {
				const renderItem = (value: string | undefined, label: string, description: string) => {
					return (
						<button
							onClick={() => {
								close();

								props.onChange(value !== undefined ? [value] : []);
							}}
							class={/* @once */ MenuItem()}
						>
							<div class="grow min-w-0">
								<p>{label}</p>
								<p class="text-de text-muted-fg">{description}</p>
							</div>

							<CheckIcon
								class="text-xl text-accent"
								classList={{
									[`invisible`]:
										value !== undefined ? !props.labels.includes(value) : props.labels.length !== 0,
								}}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="p-4 text-sm">
							<p class="font-bold">Add content warning</p>
						</div>

						{/* @once */ renderItem(undefined, `None`, `Content is suitable for everyone`)}
						{
							/* @once */ renderItem(
								'sexual',
								`Sexually suggestive`,
								`Not pornographic but still sexual in nature`,
							)
						}
						{/* @once */ renderItem('nudity', `Nudity`, `Artistic or non-erotic nudity`)}
						{/* @once */ renderItem('porn', `Pornography`, `Erotic nudity or explicit sexual activity`)}
					</div>
				);
			}}
		</Flyout>
	);
};

export default ContentWarningAction;
