import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	theme: {
		extend: {
			zIndex: {
				1: '1',
				2: '2',
			},
			spacing: {
				7.5: '1.875rem',
				13: '3.25rem',
				17: '4.24rem',
				30: '7.5rem',
				84: '21rem',
				120: '30rem',
			},
			borderWidth: {
				3: '3px',
			},
			minWidth: {
				14: '3.5rem',
				16: '4rem',
			},
			minHeight: {
				16: '4rem',
			},
			maxHeight: {
				141: '35.25rem',
				'50vh': '50vh',
			},
			flexGrow: {
				4: '4',
			},
			aspectRatio: {
				banner: '3 / 1',
			},
			keyframes: {
				indeterminate: {
					'0%': {
						translate: '-100%',
					},
					'100%': {
						translate: '400%',
					},
				},
			},
			animation: {
				indeterminate: 'indeterminate 1s linear infinite',
			},
			boxShadow: {
				menu: 'rgba(var(--primary) / 0.2) 0px 0px 15px, rgba(var(--primary) / 0.15) 0px 0px 3px 1px',
			},
		},
		colors: {
			accent: {
				DEFAULT: 'rgb(var(--accent))',
				dark: 'rgb(var(--accent-dark))',
			},
			background: 'rgb(var(--background))',
			primary: {
				DEFAULT: 'rgb(var(--primary))',
				fg: 'rgb(var(--primary-fg))',
			},
			secondary: {
				DEFAULT: 'rgb(var(--secondary))',
				fg: 'rgb(var(--secondary-fg))',
			},
			hinted: {
				DEFAULT: 'rgb(var(--hinted))',
				fg: 'rgb(var(--hinted-fg))',
			},
			muted: {
				DEFAULT: 'rgb(var(--muted))',
				fg: 'rgb(var(--muted-fg))',
			},
			input: 'rgb(var(--input))',
			divider: 'rgb(var(--divider))',

			transparent: 'transparent',
			black: colors.black,
			white: colors.white,
			red: colors.red,
			green: colors.green,
		},
		fontFamily: {
			sans: `"Roboto", ui-sans-serif, sans-serif, "Noto Color Emoji", "Twemoji Mozilla"`,
			mono: `"JetBrains Mono NL", ui-monospace, monospace`,
		},
	},
	corePlugins: {
		outlineStyle: false,
	},
	darkMode: ['class', '.is-dark'],
	plugins: [
		plugin(({ addVariant, addUtilities }) => {
			addVariant('modal', '&:modal');

			addUtilities({
				'.scrollbar-hide': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',

					'&::-webkit-scrollbar': {
						display: 'none',
					},
				},

				'.outline-none': { 'outline-style': 'none' },
				'.outline': { 'outline-style': 'solid' },
				'.outline-dashed': { 'outline-style': 'dashed' },
				'.outline-dotted': { 'outline-style': 'dotted' },
				'.outline-double': { 'outline-style': 'double' },
			});
		}),
	],
};
