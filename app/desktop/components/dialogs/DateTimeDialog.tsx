import { batch, createSignal } from 'solid-js';

import { closeModal } from '~/com/globals/modals';

import { model } from '~/utils/input';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';
import { ListGroup, ListGroupHeader } from '~/com/primitives/list-box';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';

export interface DateTimeDialogProps {
	value: Date | undefined;
	minDate?: Date;
	onChange: (next: Date | undefined) => void;
}

const getISODate = (date: Date | undefined): string | undefined => {
	if (date) {
		return date.toLocaleString('sv', { dateStyle: 'short' });
	}
};

const getISOTime = (date: Date | undefined): string | undefined => {
	if (date) {
		return date.toLocaleString('sv', { timeStyle: 'short' });
	}
};

const DateTimeDialog = (props: DateTimeDialogProps) => {
	const initialDate = props.value;
	const minDate = props.minDate;

	const onChange = props.onChange;

	const [date, setDate] = createSignal(getISODate(initialDate) ?? '');
	const [time, setTime] = createSignal(getISOTime(initialDate) ?? '');

	const handleSubmit = (ev: SubmitEvent) => {
		const $date = date();
		const $time = time();

		let inst: Date | undefined;

		ev.preventDefault();

		if ($date !== '') {
			const [y, mo, d] = $date.split('-');
			const [h, m] = $time.split(':');

			inst = new Date(+y, +mo - 1, +d, +h, +m);
		}

		batch(() => {
			onChange(inst);
			closeModal();
		});
	};

	const handleReset = () => {
		batch(() => {
			setDate('');
			setTime('');
		});
	};

	const getMinimumDate = () => {
		return getISODate(minDate);
	};

	const getMinimumTime = () => {
		const $date = date();
		return $date && $date === getISODate(minDate) ? getISOTime(minDate) : undefined;
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Select date and time</h1>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex justify-center gap-4 py-4' })}>
					<div class={ListGroup}>
						<label class={ListGroupHeader}>Date</label>
						<input
							ref={model(date, setDate)}
							type="date"
							required={time() !== ''}
							min={getMinimumDate()}
							class={/* @once */ Input()}
						/>
					</div>
					<div class={ListGroup}>
						<label class={ListGroupHeader}>Time</label>
						<input
							ref={model(time, setTime)}
							type="time"
							required={date() !== ''}
							min={getMinimumTime()}
							class={/* @once */ Input()}
						/>
					</div>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button type="button" onClick={handleReset} class="h-9 px-3 text-sm text-accent hover:underline">
						Reset
					</button>

					<div class="grow"></div>

					<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button
						type="submit"
						disabled={!date() !== !time()}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Submit
					</button>
				</div>
			</form>
		</DialogOverlay>
	);
};

export default DateTimeDialog;
