import { type JSX, For, createMemo, createSignal } from 'solid-js';

import { getNativeLanguageName, languageNames, languageNamesStrict } from '~/utils/intl/display-names.ts';
import { CODE2S } from '~/utils/intl/languages.ts';
import { model } from '~/utils/input.ts';

import { closeModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import SearchInput from '~/com/components/inputs/SearchInput.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';
import DeleteIcon from '~/com/icons/baseline-delete.tsx';

export interface CustomPostLanguageDialogProps {
	languages: string[];
	onChange: (next: string[]) => void;
}

const CustomPostLanguageDialog = (props: CustomPostLanguageDialogProps) => {
	const [languages, setLanguages] = createSignal(props.languages);

	const [search, setSearch] = createSignal('');
	const normalizedSearch = createMemo(() => search().trim().toLowerCase());

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm', fullHeight: true })}>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					<button
						title="Close dialog"
						type="button"
						onClick={closeModal}
						class={/* @once */ IconButton({ edge: 'left' })}
					>
						<CloseIcon />
					</button>

					<h1 class={/* @once */ DialogTitle()}>Post languages</h1>

					<button
						onClick={() => {
							closeModal();
							props.onChange(languages());
						}}
						class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
					>
						Save
					</button>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col pt-3', scrollable: true, padded: false })}>
					<For
						each={languages()}
						fallback={
							<div class="grid h-13 shrink-0 place-items-center pb-1 text-sm text-muted-fg">
								No languages added.
							</div>
						}
					>
						{(code, index) => (
							<div class="mx-4 flex min-w-0 items-center justify-between gap-4 pb-3">
								<div>
									<p class="text-sm">{/* @once */ languageNames.of(code)}</p>
									<p class="text-de text-muted-fg">{/* @once */ getNativeLanguageName(code)}</p>
								</div>

								<button
									title={`Remove this language`}
									onClick={() => {
										const next = languages().slice();
										next.splice(index(), 1);

										setLanguages(next);
									}}
									class={/* @once */ IconButton({ edge: 'right' })}
								>
									<DeleteIcon />
								</button>
							</div>
						)}
					</For>

					<hr class="mx-4 mt-2 border-divider" />

					<div class="p-4">
						<SearchInput ref={model(search, setSearch)} />
					</div>

					<fieldset disabled={languages().length >= 3} class="contents">
						{CODE2S.map((code) => {
							const eng = languageNamesStrict.of(code);
							const native = getNativeLanguageName(code);

							if (!eng || !native) {
								return;
							}

							const lowerEng = eng.toLowerCase();
							const lowerNative = native.toLowerCase();

							return (() => {
								const $languages = languages();

								if ($languages.includes(code)) {
									return;
								}

								const $search = normalizedSearch();
								if ($search && !lowerEng.includes($search) && !lowerNative.includes($search)) {
									return;
								}

								return (
									<div class="mx-4 flex min-w-0 items-center justify-between gap-4 pb-3">
										<div>
											<p class="text-sm">{eng}</p>
											<p class="text-de text-muted-fg">{native}</p>
										</div>
										<button
											title={`Add this language`}
											onClick={() => {
												const next = languages().concat(code);
												setLanguages(next);
											}}
											class={/* @once */ IconButton({ edge: 'right' })}
										>
											<AddIcon />
										</button>
									</div>
								);
							}) as unknown as JSX.Element;
						})}
					</fieldset>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default CustomPostLanguageDialog;
