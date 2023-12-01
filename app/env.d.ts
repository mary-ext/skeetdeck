/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_MODE: 'desktop' | 'mobile';
	readonly VITE_APP_BRAND_NAME: string;
}
