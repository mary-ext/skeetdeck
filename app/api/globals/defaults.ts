export interface DataServer {
	name: string;
	url: string;
}

export const APPVIEW_URL = 'https://api.bsky.app';

export const DEFAULT_SERVER = 'https://bsky.social';
export const DEFAULT_MODERATION_LABELER = 'did:plc:ar7c4by46qjdydhdevvrndac';

export const DEFAULT_DATA_SERVERS: DataServer[] = [
	{
		name: 'Bluesky Social',
		url: DEFAULT_SERVER,
	},
];
