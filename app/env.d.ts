/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

interface ImportMetaEnv {
	readonly VITE_BRAND_NAME: string;
	readonly VITE_BRAND_VERSION: string;

	readonly VITE_MODE: 'desktop' | 'mobile';

	readonly VITE_GIT_SOURCE: string;
	readonly VITE_GIT_COMMIT: string;
	readonly VITE_GIT_BRANCH: string;
}
