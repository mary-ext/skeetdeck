const EXCLUDED_TAGS = ['a', 'button', 'img', 'video', 'dialog'];
export const INTERACTION_TAGS = ['a', 'button'];

export const isElementClicked = (ev: Event, excludedTags: string[] = EXCLUDED_TAGS) => {
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
		const tag = node.localName;

		if (node == target) {
			break;
		}

		if (excludedTags.includes(tag)) {
			return false;
		}
	}

	if (window.getSelection()?.toString()) {
		return false;
	}

	return true;
};

export const isElementAltClicked = (ev: MouseEvent | KeyboardEvent) => {
	return ev.type === 'auxclick' || ev.ctrlKey;
};
