import { type JSX, createEffect, createSignal } from 'solid-js';

import type { AppBskyEmbedExternal } from '~/api/atp-schema';

import { Interactive } from '../../primitives/interactive';

import PlayIcon from '../../icons/baseline-play';

import BlobImage from '../BlobImage';
import CircularProgress from '../CircularProgress';

interface TenorData {
	u: string;
	r: string;
	d: string;
}

type EmbeddedLink = AppBskyEmbedExternal.ViewExternal & { __tenor?: TenorData | null };

export interface EmbedLinkData extends Omit<EmbeddedLink, 'thumb'> {
	thumb?: Blob | string;
}

export interface EmbedLinkProps {
	link: EmbedLinkData;
	interactive?: boolean;
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
const BSKY_TENOR_RE = /^https:\/\/media\.tenor\.com\/([^/]+?AAAAC)\/([^\/]+?)\?hh=(\d+?)&ww=(\d+?)$/;

const EmbedLink = (props: EmbedLinkProps) => {
	return (() => {
		const link = props.link;
		const { uri, thumb, title, description } = link;

		let tenor: TenorData | null | undefined = link.__tenor;

		if (tenor === undefined) {
			const HOST = 'https://t.gifs.bsky.app';

			const match = BSKY_TENOR_RE.exec(uri);
			const result: TenorData | null = match
				? {
						u: HOST + '/' + match[1].replace(/AAAAC$/, 'AAAP3') + '/' + match[2].replace(/\.gif$/, '.webm'),
						r: `${match[4]}/${match[3]}`,
						d: description.replace(/^ALT: /, ''),
					}
				: null;

			tenor = link.__tenor = result;
		}

		if (tenor) {
			const [playing, setPlaying] = createSignal(false);
			const [stalling, setStalling] = createSignal(false);

			return (
				<div
					class="relative overflow-hidden rounded-md border border-divider"
					style={/* @once */ { 'aspect-ratio': tenor.r }}
				>
					<video
						tabindex={-1}
						ref={(node) => {
							createEffect(() => {
								if (playing()) {
									node.play();
								} else if (!node.paused) {
									node.pause();
									node.currentTime = 0;
								}
							});
						}}
						loop
						src={/* @once */ tenor.u}
						onWaiting={() => setStalling(true)}
						onPlaying={() => setStalling(false)}
						class="h-full w-full"
					/>

					<div hidden={!(!playing() || stalling())} class="absolute inset-0 bg-black/50"></div>

					<button
						title={!playing() ? 'Play GIF' : `Pause GIF`}
						aria-description={/* @once */ tenor.d}
						onClick={() => setPlaying(!playing())}
						class="absolute inset-0 grid place-items-center rounded-md outline-2 -outline-offset-2 outline-white focus-visible:outline"
					>
						{!playing() ? (
							<div class="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-accent">
								<PlayIcon class="text-2xl" />
							</div>
						) : stalling() ? (
							<CircularProgress size={32} />
						) : null}
					</button>
				</div>
			);
		}

		const content = (
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

		if (props.interactive) {
			return (
				<a href={uri} rel="noopener noreferrer nofollow" target="_blank" class={embedLinkInteractive}>
					{content}
				</a>
			);
		}

		return content;
	}) as unknown as JSX.Element;
};

export default EmbedLink;
