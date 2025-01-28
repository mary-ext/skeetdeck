import { Button } from '~/com/primitives/button';

import AddIcon from '~/com/icons/baseline-add';
import FileIcon from '~/com/icons/baseline-file';

const FileInput = (props: { name?: string; file: File | undefined; onChange: (file: File) => void }) => {
	let inputEl!: HTMLInputElement;

	const onChange = props.onChange;

	return (
		<div>
			<input
				ref={(el) => {
					inputEl = el;
				}}
				name={props.name}
				type="file"
				class="hidden"
				onChange={(ev) => {
					const files = ev.target.files;

					if (files && files.length > 0) {
						onChange(files[0]);
					}
				}}
			/>

			<button
				type="button"
				class={/* @once */ Button({ variant: 'outline', class: 'max-w-full' })}
				onClick={() => inputEl.click()}
			>
				{(() => {
					const Icon = props.file ? FileIcon : AddIcon;

					return <Icon class="mr-2 shrink-0" />;
				})()}

				<span class="whitespace-nowrap min-w-0 text-ellipsis overflow-hidden">
					{props.file?.name ?? `Select file`}
				</span>
			</button>
		</div>
	);
};

export default FileInput;
