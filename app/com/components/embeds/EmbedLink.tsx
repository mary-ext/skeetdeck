import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { RefOf } from '~/api/atp-schema.ts';

import BlobImage from '../BlobImage.tsx';

type EmbeddedLink = RefOf<'app.bsky.embed.external#viewExternal'>;

export interface EmbedLinkData extends Omit<EmbeddedLink, 'thumb'> {
	thumb?: string | Blob;
}

export interface EmbedLinkProps {
	link: EmbedLinkData;
	interactive?: boolean;
}

const getDomain = (url: string) => {
	try {
		const host = new URL(url).host;
		return host.startsWith('www.') ? host.slice(4) : host;
	} catch {
		return url;
	}
};

const EmbedLink = (props: EmbedLinkProps) => {
	const link = () => props.link;
	const interactive = () => props.interactive;

	return (
		<Dynamic
			component={interactive() ? 'a' : 'div'}
			href={link().uri}
			rel="noopener noreferrer nofollow"
			target="_blank"
			class="flex overflow-hidden rounded-md border border-divider"
			classList={{ 'hover:bg-secondary': interactive() }}
		>
			<Show when={link().thumb} keyed>
				{(thumb) => (
					<BlobImage
						src={thumb}
						class="aspect-square w-[86px] shrink-0 border-r border-divider object-cover"
					/>
				)}
			</Show>

			<div class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm">
				<p class="text-muted-fg">{getDomain(link().uri)}</p>
				<p class="line-clamp-2 empty:hidden">{link().title}</p>
			</div>
		</Dynamic>
	);
};

export default EmbedLink;
