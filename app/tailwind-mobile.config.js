import plugin from 'tailwindcss/plugin';

import config from './tailwind-base.config.js';

/** @type {import('tailwindcss').Config} */
export default {
	...config,
	content: ['./{com,mobile}/**/*.{ts,tsx}'],
	plugins: [
		...config.plugins,
		plugin(({ addVariant, addUtilities }) => {
			addVariant('hover', '&:active');
			addVariant('group-hover', '.group:active &');
		}),
	],
};
