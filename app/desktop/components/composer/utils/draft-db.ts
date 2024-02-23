import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

import type { At } from '~/api/atp-schema';

import type { GateState } from '../ComposerContext';

export interface SerializedImage {
	blob: Blob;
	ratio: { width: number; height: number };
	alt: string;
}

export interface SerializedPostState {
	text: string;
	external: string | undefined;
	record: At.Uri | undefined;
	images: SerializedImage[];
	tags: string[];
	labels: string[];
	languages: string[];
}

export interface SerializedComposerState {
	/** What it's replying to */
	reply: string | undefined;
	/** Posts to send, up to a max of 9 posts */
	posts: SerializedPostState[];
	/** Interaction gating set for the thread */
	gate: GateState;
}

export interface ComposerDraft {
	id: string;
	title: string;
	createdAt: number;

	/** Which user are we using to send these posts */
	author: At.DID;
	/** State of the composer */
	state: SerializedComposerState;
}

interface DraftDB extends DBSchema {
	drafts: {
		key: string;
		value: ComposerDraft;
	};
}

let dbp: Promise<IDBPDatabase<DraftDB>>;
export const getDraftDb = () => {
	return (dbp ||= openDB<DraftDB>('skeetdrafts', 1, {
		upgrade(db, oldVersion) {
			if (oldVersion < 1) {
				db.createObjectStore('drafts');
			}
		},
	}));
};
