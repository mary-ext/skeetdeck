import type { JSX } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';

import { Interactive } from '../../primitives/interactive.ts';

import BlobImage from '../BlobImage.tsx';

type EmbeddedLink = RefOf<'app.bsky.embed.external#viewExternal'>;

export interface EmbedLinkData extends Omit<EmbeddedLink, 'thumb'> {
	thumb?: Blob | string;
}

export interface EmbedLinkProps {
	link: EmbedLinkData;
}

export const getDomain = (url: string) => {
	try {
		const host = new URL(url).host;
		return host.startsWith('www.') ? host.slice(4) : host;
	} catch {
		return url;
	}
};

const embedLinkInteractive = Interactive({ variant: 'muted', class: `w-full rounded-md` });

export const EmbedLinkContent = (props: EmbedLinkProps) => {
	return (() => {
		const { uri, thumb, title } = props.link;

		return (
			<div class="flex overflow-hidden rounded-md border border-divider">
				{thumb && (
					<BlobImage
						src={thumb}
						class="aspect-square w-[86px] shrink-0 border-r border-divider object-cover"
					/>
				)}

				<div class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm">
					<p class="overflow-hidden text-ellipsis text-muted-fg">{/* @once */ getDomain(uri)}</p>
					<p class="line-clamp-2 break-words empty:hidden">{title}</p>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedLink = (props: EmbedLinkProps) => {
	return (
		<a href={props.link.uri} rel="noopener noreferrer nofollow" target="_blank" class={embedLinkInteractive}>
			{/* @once */ EmbedLinkContent(props)}
		</a>
	);
};

export default EmbedLink;
