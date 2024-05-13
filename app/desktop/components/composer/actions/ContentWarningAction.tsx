import { batch, type JSX } from 'solid-js';

import { clsx } from '~/utils/misc';

import { Flyout, offsetlessMiddlewares } from '~/com/components/Flyout';
import CheckIcon from '~/com/icons/baseline-check';
import { MenuItem, MenuRoot } from '~/com/primitives/menu';

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
									`shrink-0 text-base text-accent`,
									(value !== undefined ? !selected.includes(value) : selected.length !== 0) && `invisible`,
								])}
							/>
						</button>
					);
				};

				return (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<div class="px-3 py-2 text-sm">
							<p class="font-bold">Add content warning</p>
						</div>

						{/* @once */ renderItem(undefined, `None`, `Content is suitable for everyone`)}
						{/* @once */ renderItem('sexual', `Sexually suggestive`, `Not pornographic but sexual in nature`)}
						{/* @once */ renderItem('nudity', `Nudity`, `Artistic or non-erotic nudity`)}
						{/* @once */ renderItem('porn', `Pornography`, `Erotic nudity or explicit sexual activity`)}
						{/* @once */ renderItem('graphic-media', `Graphic media`, `Disturbing content`)}
					</div>
				);
			}}
		</Flyout>
	);
};

export default ContentWarningAction;
