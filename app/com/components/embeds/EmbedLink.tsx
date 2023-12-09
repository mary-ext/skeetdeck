import type { RefOf } from '~/api/atp-schema.ts';

type EmbeddedLink = RefOf<'app.bsky.embed.external#viewExternal'>;

export interface EmbedLinkProps {
	link: EmbeddedLink;
}

export const getDomain = (url: string) => {
	try {
		const host = new URL(url).host;
		return host.startsWith('www.') ? host.slice(4) : host;
	} catch {
		return url;
	}
};

const EmbedLink = (props: EmbedLinkProps) => {
	const link = () => props.link;

	return (
		<a
			href={link().uri}
			rel="noopener noreferrer nofollow"
			target="_blank"
			class="flex overflow-hidden rounded-md border border-divider hover:bg-secondary/10"
		>
			{(() => {
				const thumb = link().thumb;

				if (thumb) {
					return (
						<img src={thumb} class="aspect-square w-[86px] shrink-0 border-r border-divider object-cover" />
					);
				}
			})()}

			<div class="flex min-w-0 flex-col justify-center gap-0.5 p-3 text-sm">
				<p class="overflow-hidden text-ellipsis text-muted-fg">{getDomain(link().uri)}</p>
				<p class="line-clamp-2 empty:hidden">{link().title}</p>
			</div>
		</a>
	);
};

export default EmbedLink;
