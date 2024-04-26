import { type JSX, createEffect, createSignal } from 'solid-js';

import type { AppBskyEmbedExternal } from '~/api/atp-schema';

import { Interactive } from '../../primitives/interactive';

import PlayIcon from '../../icons/baseline-play';

import BlobImage from '../BlobImage';
import CircularProgress from '../CircularProgress';

import { type Snippet, SnippetType, detectSnippet } from '~/com/lib/snippet';

type EmbeddedLink = AppBskyEmbedExternal.ViewExternal;

export interface EmbedLinkData extends Omit<EmbeddedLink, 'thumb'> {
	thumb?: Blob | string;
	_s?: Snippet;
}

export interface EmbedLinkProps {
	link: EmbedLinkData;
	interactive?: boolean;
}

const EmbedLink = (props: EmbedLinkProps) => {
	return (() => {
		const interactive = props.interactive;
		const link = props.link;

		const thumb = link.thumb;

		let snippet = link._s;
		if (snippet === undefined) {
			link._s = snippet = detectSnippet(link);
		}

		const t = snippet.t;

		if (t === SnippetType.BLUESKY_GIF) {
			const [playing, setPlaying] = createSignal(false);
			const [stalling, setStalling] = createSignal(false);

			return (
				<div
					class="relative max-h-80 self-start overflow-hidden rounded-md border border-divider"
					style={/* @once */ { 'aspect-ratio': snippet.r }}
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
						src={/* @once */ snippet.u}
						onWaiting={() => setStalling(true)}
						onPlaying={() => setStalling(false)}
						class="h-full w-full"
					/>

					<div hidden={!(!playing() || stalling())} class="absolute inset-0 bg-black/50"></div>

					<button
						title={!playing() ? 'Play GIF' : `Pause GIF`}
						aria-description={/* @once */ snippet.d}
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

		if (t === SnippetType.IFRAME && interactive) {
			const [show, setShow] = createSignal(false);

			return [
				() => {
					if (show()) {
						return (
							<div
								class="overflow-hidden rounded-md border border-divider"
								style={/* @once */ { 'aspect-ratio': snippet.r }}
							>
								<iframe src={/* @once */ snippet.u} allowfullscreen class="h-full w-full" />
							</div>
						);
					}

					return (
						<div class="flex overflow-hidden rounded-md border border-divider">
							<button
								onClick={() => setShow(true)}
								class="relative aspect-square w-[86px] shrink-0 border-r border-divider"
							>
								{thumb && <BlobImage src={thumb} class="h-full w-full object-cover" />}

								<div class="absolute inset-0 grid place-items-center">
									<div class="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-accent">
										<PlayIcon class="text-2xl" />
									</div>
								</div>
							</button>

							<a
								href={/* @once */ link.uri}
								rel="noopener noreferrer nofollow"
								target="_blank"
								class={
									/* @once */ Interactive({
										variant: 'muted',
										class: 'flex min-w-0 grow flex-col justify-center gap-0.5 p-3 text-sm',
									})
								}
							>
								<p class="overflow-hidden text-ellipsis text-muted-fg empty:hidden">
									{/* @once */ snippet.d}
								</p>
								<p class="line-clamp-2 break-words empty:hidden">{/* @once */ link.title}</p>
							</a>
						</div>
					);
				},
			];
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
					<p class="overflow-hidden text-ellipsis text-muted-fg empty:hidden">{/* @once */ snippet.d}</p>
					<p class="line-clamp-2 break-words empty:hidden">{/* @once */ link.title}</p>
				</div>
			</div>
		);

		if (interactive) {
			return (
				<a
					href={/* @once */ link.uri}
					rel="noopener noreferrer nofollow"
					target="_blank"
					class={/* @once */ Interactive({ variant: 'muted', class: `w-full rounded-md` })}
				>
					{content}
				</a>
			);
		}

		return content;
	}) as unknown as JSX.Element;
};

export default EmbedLink;
