/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BRAND_NAME: string;

	readonly VITE_MODE: 'desktop' | 'mobile';

	readonly VITE_GIT_SOURCE: string;
	readonly VITE_GIT_COMMIT: string;
	readonly VITE_GIT_BRANCH: string;
}
