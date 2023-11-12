import { type ComponentProps } from 'solid-js';
import { spread, template } from 'solid-js/web';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_NS = 'icons';

let uid = 0;
let defs: SVGDefsElement;

interface PathAttrs {
	fill?: 'currentColor' | (string & {});
	'fill-rule'?: 'evenodd' | (string & {});
}

type PathDef = [d: string, attrs?: PathAttrs];

const DEFAULT_ATTRS: PathAttrs = {
	fill: 'currentColor',
};

const pushIcon = (paths: PathDef[]) => {
	const id = ICON_NS + uid++;
	const symbol = document.createElementNS(SVG_NS, 'symbol');

	symbol.id = id;

	for (let idx = 0, len = paths.length; idx < len; idx++) {
		const path = paths[idx];

		const d = path[0];
		const attrs = path[1] ?? DEFAULT_ATTRS;

		const node = document.createElementNS(SVG_NS, 'path');
		node.setAttribute('d', d);

		for (const key in attrs) {
			// @ts-expect-error
			const val = attrs[key];
			node.setAttribute(key, val);
		}

		symbol.appendChild(node);
	}

	if (!defs) {
		const svg = document.head.appendChild(document.createElementNS(SVG_NS, 'svg'));
		svg.appendChild((defs = document.createElementNS(SVG_NS, 'defs')));
	}

	defs.appendChild(symbol);

	return id;
};

/*#__NO_SIDE_EFFECTS__*/
export const createIcon = (paths: PathDef[], viewBox = '0 0 24 24') => {
	const href = '#' + pushIcon(paths);

	const tmpl = template(`<svg height=1em width=1em viewBox="${viewBox}"><use href=${href}>`);
	return Icon.bind(tmpl);
};

function Icon(this: () => Element, props: ComponentProps<'svg'>) {
	const svg = this();
	spread(svg, props, true, true);

	return svg;
}
