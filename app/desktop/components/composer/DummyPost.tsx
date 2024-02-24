import type { JSX } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

export interface DummyPostProps {
	post: SignalizedPost;
}

const DummyPost = (props: DummyPostProps) => {
	return (() => {
		const post = props.post;
		const author = post.author;

		const record = () => post.record.value;

		return (
			<div class="flex min-w-0 gap-3 px-4 pt-3">
				<div class="flex shrink-0 flex-col items-center">
					<img src={author.avatar.value || DefaultUserAvatar} class="h-9 w-9 rounded-full" />
					<div class="-mb-4 mt-2 grow border-l-2 border-divider" />
				</div>

				<div class="min-w-0 grow">
					<div class="mb-0.5 flex gap-1 overflow-hidden text-sm text-muted-fg">
						{author.displayName.value && (
							<bdi class="overflow-hidden text-ellipsis whitespace-nowrap">
								<span class="font-bold text-primary">{author.displayName.value}</span>
							</bdi>
						)}

						<span class="overflow-hidden text-ellipsis whitespace-nowrap">@{author.handle.value}</span>
					</div>

					<div class="line-clamp-[12] whitespace-pre-wrap break-words text-sm">{record().text}</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

export default DummyPost;
