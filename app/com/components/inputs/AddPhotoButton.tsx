import { type JSX, createSignal } from 'solid-js';

import { type Middleware } from '@floating-ui/dom';
import { getSide } from '@floating-ui/utils';

import { compressProfileImage } from '~/utils/image';

import { Interactive } from '../../primitives/interactive';
import { MenuItem, MenuRoot } from '../../primitives/menu';

import { Flyout, offsetlessMiddlewares } from '../Flyout';
import CircularProgress from '../CircularProgress';

import AddPhotoAlternateIcon from '../../icons/baseline-add-photo-alternate';

export interface AddPhotoButtonProps {
	exists: boolean;
	title: string;
	maxWidth: number;
	maxHeight: number;
	onPick: (blob: Blob | undefined) => void;
}

const buttonOffset: Middleware = {
	name: 'offset',
	fn(state) {
		const reference = state.rects.reference;
		const x = state.x;
		const y = state.y;

		const multi = getSide(state.placement) === 'bottom' ? 1 : -1;

		return {
			x: x,
			y: y + 9 + 4 - reference.height * 0.5 * multi,
		};
	},
};

const AddPhotoButton = (props: AddPhotoButtonProps) => {
	let input: HTMLInputElement | undefined;

	const [loading, setLoading] = createSignal(false);

	const processBlob = async (file: File) => {
		if (loading()) {
			return;
		}

		setLoading(true);

		try {
			const { maxWidth, maxHeight } = props;
			const result = await compressProfileImage(file, maxWidth, maxHeight);

			props.onPick(result.blob);
		} catch {}

		setLoading(false);
	};

	const handleFileInput = (ev: Event & { currentTarget: HTMLInputElement }) => {
		const target = ev.currentTarget;
		const files = Array.from(target.files!);

		target.value = '';

		if (files.length > 0) {
			processBlob(files[0]);
		}
	};

	const handleButtonClick = () => {
		if (props.exists) {
			// todo mobile scenario
		} else {
			input!.click();
		}
	};

	return [
		() => {
			if (loading()) {
				return (
					<div class="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/75">
						<CircularProgress />
					</div>
				);
			}

			const isDesktop = import.meta.env.VITE_MODE === 'desktop';
			const exists = props.exists;

			const shouldDisplayFlyout = isDesktop && exists;

			const buttonClass = Interactive({
				variant: 'white',
				class: `grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg text-white backdrop-blur disabled:opacity-50`,
			});

			const button = (
				<label class="absolute inset-0 grid place-items-center">
					<button
						type="button"
						title={props.title}
						onClick={!shouldDisplayFlyout ? handleButtonClick : undefined}
						class={buttonClass}
					>
						<AddPhotoAlternateIcon class="drop-shadow" />
					</button>
				</label>
			);

			if (shouldDisplayFlyout) {
				return (
					<Flyout button={button} placement="bottom" middleware={[buttonOffset, ...offsetlessMiddlewares]}>
						{({ close, menuProps }) => (
							<div {...menuProps} class={/* @once */ MenuRoot()}>
								<button
									type="button"
									onClick={() => {
										close();
										input!.showPicker();
									}}
									class={/* @once */ MenuItem()}
								>
									Choose a new image
								</button>

								<button
									type="button"
									onClick={() => {
										close();
										props.onPick(undefined);
									}}
									class={/* @once */ MenuItem()}
								>
									Remove existing image
								</button>
							</div>
						)}
					</Flyout>
				);
			}

			return button;
		},

		<input ref={input} type="file" class="hidden" accept="image/*" onChange={handleFileInput} />,
	] as unknown as JSX.Element;
};

export default AddPhotoButton;
