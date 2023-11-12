import config from './tailwind-base.config.js';

/** @type {import('tailwindcss').Config} */
export default {
	...config,
	content: ['./{com,desktop}/**/*.{ts,tsx}'],
};
