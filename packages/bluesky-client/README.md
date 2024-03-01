# bluesky-client

<a href="https://pkg-size.dev/@externdefs/bluesky-client"><img src="https://pkg-size.dev/badge/bundle/6253" title="Bundle size for @externdefs/bluesky-client"></a>

Lightweight API client for Bluesky/AT Protocol.

```
# npm
npm install @externdefs/bluesky-client

# jsr
jsr add @mary/bluesky-client
```

This is an [ESM-only library](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c), if you are using TypeScript you'd need to [configure your projects correctly](https://www.typescriptlang.org/tsconfig#moduleResolution) in order to pick up the type declarations.

## Why?

The official `@atproto/api` library is big! <a href="https://pkg-size.dev/@atproto/api"><img src="https://pkg-size.dev/badge/bundle/461666" title="Bundle size for @atproto/api"></a>

- The lexicon codegen generates a ton of classes and functions due to the API being designed around RPC and namespaces. These can't be treeshaken at all if you only need access to some of the endpoints.
- The library unnecessarily bundles dependencies like `graphemer` and `zod`, which causes duplication in your app code if you also rely on said libraries.

The points above leads to `@externdefs/bluesky-client`, where the following tradeoffs are made instead:

- We only provide TypeScript definitions for endpoints, objects, and records, **there is no runtime validation done in the library, proceed with caution**.
- Queries and procedures are not accessed via property access, you're typing the nsid as a string instead.

  ```typescript
  // ❎️
  agent.app.bsky.actor.getProfile({ actor: 'did:plc:ragtjsm2j2vknwkz3zp4oxrd' });

  // ✅️
  agent.rpc.get('app.bsky.actor.getProfile', {
  	params: {
  		actor: 'did:plc:ragtjsm2j2vknwkz3zp4oxrd',
  	},
  });
  ```

- No RichText class for handling texts with facets, examples as to how you can deal with RichText are available on the `examples/` folder.
- No Moderation API for taking actions based on certain labels or status, this should be very trivial so long as you [follow the official documentations on how it should be dealt with](https://github.com/bluesky-social/atproto/blob/main/packages/api/docs/moderation.md).

## Usage

### Creating an agent to make requests...

```ts
import { Agent } from '@externdefs/bluesky-client/agent';

const agent = new Agent({ serviceUri: 'https://bsky.social' });

await agent.login({
	identifier: '...',
	password: '...',
});

const profile = await agent.rpc.get('app.bsky.actor.getProfile', {
	params: {
		actor: 'did:plc:ragtjsm2j2vknwkz3zp4oxrd',
	},
});

console.log(profile);
```

### Fiddling with AT Protocol schema...

Typings for AT Protocol lexicons can be accessed by the `/atp-schema` subimport.

```ts
import type { AppBskyRichtextFacet, Brand } from '@externdefs/bluesky-client/atp-schema';

type Facet = AppBskyRichtextFacet.Main;
type MentionFeature = Brand.Union<AppBskyRichtextFacet.Mention>;

const mention: MentionFeature = {
	$type: 'app.bsky.richtext.facet#mention',
	did: 'did:plc:ragtjsm2j2vknwkz3zp4oxrd',
};

const facet: Facet = {
	index: {
		byteStart: 7,
		byteEnd: 12,
	},
	features: [mention],
};
```

For the most part, it is 1:1 with the official library's typings, but it's also stricter with the branded typing that's present on each interface.

It's slightly annoying in that a function accepting `AppBskyActorDefs.ProfileViewBasic` can't also accept `ProfileViewDetailed` without making it a union. (depending on how you see it)

However, it allows for AT Protocol's discriminated unions to be typed properly, and that's the best part about this approach.

## Barebones usage

If you don't need the session handling that `Agent` class offers, you can import
the `XRPC` class directly, this shaves the bundle size from 6.2 KB to 2.8 KB.

```ts
import type { Procedures, Queries } from '@externdefs/bluesky-client/atp-schema';
import { XRPC } from '@externdefs/bluesky-client/xrpc';

export type Agent = XRPC<Queries, Procedures>;
export const Agent = XRPC<Queries, Procedures>;
```
