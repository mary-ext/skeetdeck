import { type DidDocument, Agent, getPdsEndpoint } from '@externdefs/bluesky-client/agent';
import type { QueryClient } from '@pkg/solid-query';

import type { At } from './atp-schema';
import { APPVIEW_URL } from './globals/defaults';
import { isDid } from './utils/misc';

const HOST_RE = /^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+))$/;

export const retrievePdsEndpoint = async (client: QueryClient, identifier: string): Promise<string> => {
	if (identifier.includes('@')) {
		throw new Error(`Email not supported`);
	}

	let did: At.DID;
	let isAlreadyDid = false;

	if (isDid(identifier)) {
		did = identifier;
		isAlreadyDid = true;
	} else {
		did = await client.fetchQuery({
			queryKey: ['appView/resolveHandle', identifier],
			queryFn: async (ctx) => {
				const [, identifier] = ctx.queryKey;

				const agent = new Agent({ serviceUri: APPVIEW_URL });
				const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
					signal: ctx.signal,
					params: {
						handle: identifier,
					},
				});

				return response.data.did;
			},
			gcTime: 60 * 5_000,
		});
	}

	const [, type, ...rest] = did.split(':');
	const ident = rest.join(':');

	// 2. retrieve their DID documents
	let doc: DidDocument;

	if (type === 'plc') {
		doc = await client.fetchQuery({
			queryKey: ['did/plc/getDocument', did],
			queryFn: async (ctx) => {
				const [, did] = ctx.queryKey;

				const response = await fetch(`https://plc.directory/${did}`, { signal: ctx.signal });

				if (response.status === 404) {
					throw new Error(`DID not registered`);
				} else if (!response.ok) {
					throw new Error(`Unable to contact PLC directory, response error ${response.status}`);
				}

				const json = await response.json();

				return json as DidDocument;
			},
			gcTime: 60 * 5_000,
		});
	} else if (type === 'web') {
		if (!HOST_RE.test(ident)) {
			throw new Error(`Invalid did:web identifier: ${ident}`);
		}

		doc = await client.fetchQuery({
			queryKey: ['did/web/getDocument', ident],
			queryFn: async (ctx) => {
				const [, ident] = ctx.queryKey;

				const response = await fetch(`https://${ident}/.well-known/did.json`, { signal: ctx.signal });

				if (response.status === 404) {
					throw new Error(`DID document not found`);
				} else if (!response.ok) {
					throw new Error(`Unable to retrieve DID document, response error ${response.status}`);
				}

				const json = await response.json();

				return json as DidDocument;
			},
			gcTime: 60 * 5_000,
		});
	} else {
		throw new Error(`Unsupported DID type: ${type}`);
	}

	// 3. get the PDS endpoint
	const pds = getPdsEndpoint(doc);

	if (!pds) {
		throw new Error(`Unable to find PDS endpoint for this ${isAlreadyDid ? `DID` : `domain`}`);
	}

	return pds;
};
