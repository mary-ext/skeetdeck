export const isMac = /^Mac/i.test(navigator.platform);

const DEFAULT_EXCLUSION = 'a, button, img, video, dialog, [role=button]';
export const INTERACTION_TAGS = 'a, button, [role=button]';

export const isElementClicked = (ev: Event, exclusion = DEFAULT_EXCLUSION) => {
	const target = ev.currentTarget as HTMLElement;
	const path = ev.composedPath() as HTMLElement[];

	if (
		!path.includes(target) ||
		(ev.type === 'keydown' && (ev as KeyboardEvent).key !== 'Enter') ||
		(ev.type === 'auxclick' && (ev as MouseEvent).button !== 1)
	) {
		return false;
	}

	for (let idx = 0, len = path.length; idx < len; idx++) {
		const node = path[idx];

		if (node == target) {
			break;
		}

		if (node.matches(exclusion)) {
			return false;
		}
	}

	if (window.getSelection()?.toString()) {
		return false;
	}

	return true;
};

export const isElementAltClicked = (ev: MouseEvent | KeyboardEvent) => {
	return ev.type === 'auxclick' || isCtrlKeyPressed(ev);
};

export const isCtrlKeyPressed = (ev: MouseEvent | KeyboardEvent) => {
	return isMac ? ev.metaKey : ev.ctrlKey;
};
