import { type DidDocument } from '@mary/bluesky-client';

import type { At } from './atp-schema';
import { publicAppView } from './globals/agent';
import { isDid } from './utils/misc';

const HOST_RE = /^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+))$/;

export const getDidInfo = async (identifier: string): Promise<DidDocument> => {
	if (identifier.includes('@')) {
		throw new Error(`Email not supported`);
	}

	let did: At.DID;

	if (isDid(identifier)) {
		did = identifier;
	} else {
		const response = await publicAppView.get('com.atproto.identity.resolveHandle', {
			params: {
				handle: identifier,
			},
		});

		did = response.data.did;
	}

	const [, type, ...rest] = did.split(':');
	const ident = rest.join(':');

	// 2. retrieve their DID documents
	let doc: DidDocument;

	if (type === 'plc') {
		const response = await fetch(`https://plc.directory/${did}`);

		if (response.status === 404) {
			throw new Error(`DID not registered`);
		} else if (!response.ok) {
			throw new Error(`Unable to contact PLC directory, response error ${response.status}`);
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else if (type === 'web') {
		if (!HOST_RE.test(ident)) {
			throw new Error(`Invalid did:web identifier: ${ident}`);
		}

		const response = await fetch(`https://${ident}/.well-known/did.json`);

		if (response.status === 404) {
			throw new Error(`DID document not found`);
		} else if (!response.ok) {
			throw new Error(`Unable to retrieve DID document, response error ${response.status}`);
		}

		const json = await response.json();

		doc = json as DidDocument;
	} else {
		throw new Error(`Unsupported DID type: ${type}`);
	}

	return doc;
};
