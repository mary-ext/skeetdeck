/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

/// <reference types="dom-close-watcher" />
/// <reference types="dom-navigation" />

interface ImportMetaEnv {
	readonly VITE_BRAND_NAME: string;
	// readonly VITE_BRAND_VERSION: string;

	readonly VITE_MODE: 'desktop' | 'mobile';

	// readonly VITE_GIT_SOURCE: string;
	// readonly VITE_GIT_COMMIT: string;
	// readonly VITE_GIT_BRANCH: string;
}

// `@types/dom-navigation` doesn't inject a global.
declare var navigation: Navigation;

interface Window {
	ENV: {
		VERSION: string;
		GIT_SOURCE: string;
		GIT_COMMIT: string;
		GIT_BRANCH: string;
	};
}
