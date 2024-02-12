import { type JSX, onMount } from 'solid-js';

import { useParams } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { formatCompact } from '~/utils/intl/number';

import ProfileHeader from '~/com/components/views/ProfileHeader';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';

import { IconButton } from '~/com/primitives/icon-button';
import { Interactive } from '~/com/primitives/interactive';

import ViewHeader from '../components/ViewHeader';
import CircularProgress from '~/com/components/CircularProgress';

const iconBtn = Interactive({
	variant: 'white',
	class: `grid h-8 w-8 place-items-center rounded-full bg-black/50 text-lg text-white backdrop-blur disabled:opacity-50`,
});

const ProfileView = () => {
	const { actor } = useParams();

	const query = createQuery(() => {
		const key = getProfileKey(multiagent.active!, actor);

		return {
			queryKey: key,
			queryFn: getProfile,
			initialData: () => getInitialProfile(key),
			initialDataUpdatedAt: 0,
		};
	});

	return (() => {
		const profile = query.data;
		if (profile) {
			// @ts-expect-error
			const timeline = new ScrollTimeline({ source: document.documentElement });

			let paddedHeight: number;

			const headerRef = (node: HTMLElement) => {
				onMount(() => {
					const rect = node.getBoundingClientRect();
					const width = rect.width;

					const height = Math.floor((1 / 3) * width);
					paddedHeight = height + 16 + 36 + 12 + 28;

					node.animate(
						{
							background: ['transparent', 'black'],
							borderColor: ['transparent', 'rgb(var(--divider))'],
						},
						// @ts-expect-error
						{ timeline, rangeEnd: paddedHeight + 'px', fill: 'forwards' },
					);
				});
			};

			const titleWrapperRef = (node: HTMLElement) => {
				onMount(() => {
					node.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], {
						timeline,
						// @ts-expect-error
						rangeEnd: paddedHeight + 100 + 'px',
						fill: 'forwards',
					});
				});
			};

			return (
				<div class="contents">
					<div
						ref={headerRef}
						class="sticky top-0 z-30 -mt-13 flex h-13 min-w-0 shrink-0 items-center gap-2 border-b border-transparent px-4"
					>
						<button
							onClick={() => {
								if (navigation.canGoBack) {
									navigation.back();
								} else {
									navigation.navigate('/', { history: 'replace' });
								}
							}}
							class={`${iconBtn} -ml-2`}
						>
							<ArrowLeftIcon />
						</button>

						<div ref={titleWrapperRef} class="flex min-w-0 grow flex-col gap-0.5 opacity-0">
							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
								{profile.displayName.value}
							</p>

							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
								{`${formatCompact(profile.postsCount.value)} posts`}
							</p>
						</div>
					</div>

					<ProfileHeader profile={profile} />
				</div>
			);
		}

		return [
			<ViewHeader back="/" title="Profile" />,
			<div class="grid h-13 place-items-center">
				<CircularProgress />
			</div>,
		];
	}) as unknown as JSX.Element;
};

export default ProfileView;
