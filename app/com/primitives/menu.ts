import { Interactive } from './interactive';

export const MenuRoot = () => {
	return `flex max-w-sm flex-col overflow-hidden overflow-y-auto rounded-lg bg-background shadow-menu`;
};

export interface MenuItemProps {
	variant?: 'default' | 'danger';
}

export const MenuItem = (props: MenuItemProps = {}) => {
	const { variant = 'default' } = props;

	let cn = Interactive({
		variant,
		class: `flex items-center gap-4 px-4 py-2.5 text-left text-sm disabled:opacity-50`,
	});

	if (variant === 'danger') {
		cn += ` text-red-500`;
	}

	return cn;
};

export const MenuItemIcon = () => {
	return `shrink-0 text-lg`;
};
