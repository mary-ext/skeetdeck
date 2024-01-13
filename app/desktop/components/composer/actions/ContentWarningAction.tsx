import { type JSX, batch } from 'solid-js';

import { clsx } from '~/utils/misc.ts';

import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout.tsx';

import CheckIcon from '~/com/icons/baseline-check.tsx';

export interface ContentWarningActionProps {
	labels: string[];
	children: JSX.Element;
}

const ContentWarningAction = (props: ContentWarningActionProps) => {
	return (
		<Flyout button={props.children} placement="bottom" middleware={offsetlessMiddlewares}>
			{({ close, menuProps }) => {
				const selected = props.labels;

				const renderItem = (value: string | undefined, label: string, description: string) => {
					return (
						<button
							onClick={() => {
								close();

								batch(() => {
									selected.length = 0;

									if (value !== undefined) {
										selected.push(value);
									}
								});
							}}
							class={/* @once */ MenuItem()}
						>
							<div class="min-w-0 grow">
								<p>{label}</p>
								<p class="text-de text-muted-fg">{description}</p>
							</div>

							<CheckIcon
								class={clsx([
									`text-xl text-accent`,
									(value !== undefined ? !selected.includes(value) : selected.length !== 0) && `invisible`,
								])}
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
