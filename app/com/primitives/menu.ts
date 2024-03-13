import { Interactive } from './interactive';

const isDesktop = import.meta.env.VITE_MODE === 'desktop';

export const MenuRoot = () => {
	if (isDesktop) {
		return `flex min-w-56 max-w-sm flex-col overflow-hidden overflow-y-auto rounded-md bg-background py-1 shadow-menu`;
	}

	return `flex max-w-sm flex-col overflow-hidden overflow-y-auto rounded-md bg-background shadow-menu`;
};

export interface MenuItemProps {
	variant?: 'default' | 'danger';
}

export const MenuItem = (props: MenuItemProps = {}): string => {
	const { variant = 'default' } = props;

	if (isDesktop) {
		let cn = Interactive({
			variant,
			class: `flex items-center gap-2 px-3 py-2 text-left text-de disabled:opacity-50`,
		});

		if (variant === 'danger') {
			cn += ` text-red-500`;
		}

		return cn;
	} else {
		let cn = Interactive({
			variant,
			class: `flex items-center gap-4 px-4 py-2.5 text-left text-sm disabled:opacity-50`,
		});

		if (variant === 'danger') {
			cn += ` text-red-500`;
		}

		return cn;
	}
};

export const MenuItemIcon = () => {
	if (isDesktop) {
		return `shrink-0 text-base`;
	}

	return `shrink-0 text-lg`;
};
