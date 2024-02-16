import '@pkg/solid-navigation';

declare module '@pkg/solid-navigation' {
	interface RouteMeta {
		name?: string;
		main?: boolean;
		public?: boolean;
	}
}
