import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { dequal } from '~/utils/dequal.ts';

import { closeModal } from '../../globals/modals.tsx';

import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog.ts';
import { IconButton } from '../../primitives/icon-button.ts';

import GenericErrorView from '../views/GenericErrorView.tsx';
import CircularProgress from '../CircularProgress.tsx';
import DialogOverlay from './DialogOverlay.tsx';

import CloseIcon from '../../icons/baseline-close.tsx';
import { formatAbsDateTime } from '~/utils/intl/time.ts';

export interface HandleHistoryDialogProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const HandleHistoryDialog = (props: HandleHistoryDialogProps) => {
	const profile = props.profile;

	const history = createQuery(() => {
		return {
			queryKey: ['/getHandleHistory', profile.did],
			queryFn: async (ctx) => {
				const [, did] = ctx.queryKey;

				const url = `https://plc.directory/${did}/log/audit`;

				const response = await fetch(url);
				const json = (await response.json()) as AuditEntry[];

				const entries: IdentifierHistoryEntry[] = [];
				let current: string[] | null = null;

				for (let idx = 0, len = json.length; idx < len; idx++) {
					const entry = json[idx];

					const operation = entry.operation;
					const type = operation.type;

					if (type === 'plc_operation') {
						const knownAs = operation.alsoKnownAs
							.filter((uri) => uri.startsWith('at://'))
							.map((uri) => uri.slice(5));

						if (!dequal(current, knownAs)) {
							entries.push({ knownAs: (current = knownAs), createdAt: entry.createdAt });
						}
					} else if (type === 'create') {
						const knownAs = [operation.handle];

						if (!dequal(current, knownAs)) {
							entries.push({ knownAs: (current = knownAs), createdAt: entry.createdAt });
						}
					}
				}

				entries.reverse();
				return { entries: entries };
			},
		};
	});

	if (import.meta.env.VITE_MODE === 'desktop') {
		return (
			<DialogOverlay>
				<div class={/* @once */ DialogRoot({ size: 'md', fullHeight: true })}>
					<div class={/* @once */ DialogHeader({ divider: true })}>
						<button
							title="Close dialog"
							onClick={closeModal}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<CloseIcon />
						</button>

						<h1 class={/* @once */ DialogTitle()}>Handle history for @{profile.handle.value}</h1>
					</div>

					<div class={/* @once */ DialogBody({ padded: false, scrollable: true, class: 'flex flex-col' })}>
						{(() => {
							if (history.isSuccess) {
								const nodes = history.data.entries.map((entry, idx) => {
									const knownAs = entry.knownAs.map((handle) => {
										return <li class="break-words">{handle}</li>;
									});

									return (
										<li
											class={`border-l-4 py-1 pl-3 text-sm ` + (idx === 0 ? `border-accent` : `border-muted`)}
										>
											<ul class={/* @once */ knownAs.length > 1 ? `mb-1 list-disc pl-4` : ``}>{knownAs}</ul>
											<p class="text-muted-fg">{/* @once */ formatAbsDateTime(entry.createdAt)}</p>
										</li>
									);
								});

								return <ul class="flex flex-col gap-2 px-3 py-3">{nodes}</ul>;
							}

							if (history.isError) {
								return (
									<GenericErrorView error={/* @once */ history.error} onRetry={() => history.refetch()} />
								);
							}

							return (
								<div class="grid h-13 place-items-center">
									<CircularProgress />
								</div>
							);
						})()}
					</div>
				</div>
			</DialogOverlay>
		);
	}

	return null;
};

export default HandleHistoryDialog;

interface LegacyGenesisOp {
	type: 'create';
	/** did:key */
	signingKey: string;
	/** did:key */
	recoveryKey: string;
	handle: string;
	service: string;
	prev: string | null;
	sig: string;
}

interface Service {
	type: string;
	endpoint: string;
}

interface OperationOp {
	type: 'plc_operation';
	/** did:key[] */
	rotationKeys: string[];
	/** Record<string, did:key> */
	verificationMethods: Record<string, string>;
	alsoKnownAs: string[];
	services: Record<string, Service>;
	prev: string | null;
	sig: string;
}

interface TombstoneOp {
	type: 'plc_tombstone';
	prev: string;
	sig: string;
}

type PlcOperation = LegacyGenesisOp | OperationOp | TombstoneOp;

interface AuditEntry {
	did: DID;
	operation: PlcOperation;
	cid: string;
	nullified?: boolean;
	createdAt: string;
}

interface IdentifierHistoryEntry {
	knownAs: string[];
	createdAt: string;
}
