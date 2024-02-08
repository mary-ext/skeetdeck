import config from './tailwind-base.config.js';

/** @type {import('tailwindcss').Config} */
export default {
	...config,
	content: ['./{com,mobile}/**/*.{ts,tsx}'],
};
