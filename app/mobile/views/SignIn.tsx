import { createSignal } from 'solid-js';

import { Agent } from '@externdefs/bluesky-client/agent';
import { createQuery } from '@pkg/solid-query';

import { DEFAULT_DATA_SERVERS } from '~/api/globals/defaults';

import { model } from '~/utils/input';

import { Input } from '~/com/primitives/input';

import ViewHeader from '../components/ViewHeader';
import { Button } from '~/com/primitives/button';
import EditIcon from '~/com/icons/baseline-edit';

const SignIn = () => {
	const [service, setService] = createSignal(DEFAULT_DATA_SERVERS[0]);

	const info = createQuery(() => {
		return {
			queryKey: ['/describeServer', service().url],
			queryFn: async (ctx) => {
				const [, url] = ctx.queryKey;
				const agent = new Agent({ serviceUri: url });
				const response = await agent.rpc.get('com.atproto.server.describeServer', {});

				return response.data;
			},
		};
	});

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	return (
		<fieldset class="contents">
			<ViewHeader back="/" title="Sign in" />

			<form class="flex grow flex-col gap-8 p-4">
				<div>
					<span class="mb-2 block text-sm font-medium leading-6 text-primary">Hosting provider</span>

					<button
						type="button"
						class="flex h-9 w-full grow items-center justify-between rounded-md border border-input text-sm outline-2 -outline-offset-1 outline-accent outline-none hover:bg-secondary/30 focus-visible:outline"
					>
						<span class="px-3 py-2">{service().name}</span>
						<div class="grid h-8 w-8 place-items-center">
							<EditIcon class="text-base text-muted-fg" />
						</div>
					</button>
				</div>

				<div class="flex flex-col gap-4">
					<label class="block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Handle or email address</span>
						<input
							ref={model(identifier, setIdentifier)}
							type="text"
							required
							title="Bluesky handle, DID, or email address"
							pattern=".*\\S+.*"
							placeholder="you.bsky.social"
							autocomplete="username"
							class={/* @once */ Input()}
						/>
					</label>

					<div>
						<label class="block">
							<span class="mb-2 block text-sm font-medium leading-6 text-primary">Password</span>
							<input
								ref={model(password, setPassword)}
								type="password"
								required
								autocomplete="password"
								placeholder="Password"
								class={/* @once */ Input()}
							/>
						</label>

						<p class="mt-2 text-de text-muted-fg">
							Using an app password is recommended.{' '}
							<button type="button" class="text-accent hover:underline">
								Learn more
							</button>
						</p>
					</div>
				</div>

				<button type="submit" disabled={!info.data} class={/* @once */ Button({ variant: 'primary' })}>
					Sign in
				</button>
			</form>
		</fieldset>
	);
};

export default SignIn;
