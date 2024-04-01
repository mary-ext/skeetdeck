import { Interactive } from './interactive';

export const ListGroup = `flex flex-col gap-2`;

export const ListGroupHeader = `text-sm font-bold leading-5 text-muted-fg`;

export const ListGroupBlurb = `text-de text-muted-fg`;

export const ListBox = `flex flex-col divide-y divide-secondary/30 overflow-hidden rounded bg-secondary/20`;

export const ListBoxBlock = `px-4 py-3 text-left text-sm`;

export const ListBoxItem = `${ListBoxBlock} flex items-center gap-3`;

export const ListBoxItemInteractive = Interactive({
	variant: 'muted',
	class: `${ListBoxItem} disabled:opacity-50`,
});

export const ListBoxItemReadonly = Interactive({
	variant: 'muted',
	class: ListBoxItem,
});

export const ListBoxItemIcon = `shrink-0 text-lg text-muted-fg`;
export const ListBoxItemChevron = `shrink-0 text-xl text-muted-fg`;
