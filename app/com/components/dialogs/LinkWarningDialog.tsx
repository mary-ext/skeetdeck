import * as tldts from 'tldts';

import ConfirmDialog from './ConfirmDialog.tsx';

export interface LinkWarningDialogProps {
	/** Expected to be static */
	url: string;
	/** Expected to be static */
	onConfirm: () => void;
}

const LinkWarningDialog = (props: LinkWarningDialogProps) => {
	const { url, onConfirm } = props;

	return (
		<ConfirmDialog
			title={`Heads up!`}
			body={
				<>
					<p class="text-sm">You're about to visit the following URL:</p>

					<div class="w-full overflow-y-auto break-words rounded-md border border-input px-3 py-2 text-sm text-muted-fg">
						{/* @once */ formatHref(url)}
					</div>

					<p class="text-sm">Make sure this is the place you're intending to go.</p>
				</>
			}
			unwrap
			confirmation="Visit"
			onConfirm={onConfirm}
		/>
	);
};

export default LinkWarningDialog;

const formatHref = (url: string) => {
	let urlp: URL;
	try {
		urlp = new URL(url);
	} catch {
		return <strong class="text-primary">{url}</strong>;
	}

	const hostname = urlp.hostname;
	const port = urlp.port;

	const tld = tldts.parse(hostname, { allowPrivateDomains: true });
	const domain = tld.domain;
	const subdomain = tld.subdomain;

	let prefix = '';
	let emboldened = '';

	if (domain) {
		if (subdomain) {
			prefix = subdomain + '.';
		}

		emboldened = domain + (port ? ':' + port : '');
	} else {
		emboldened = urlp.host;
	}

	return (
		<span>
			{/* @once */ urlp.protocol + '//' + buildAuth(urlp) + prefix}
			<strong class="text-primary">{emboldened}</strong>
			{/* @once */ urlp.pathname + urlp.search + urlp.hash}
		</span>
	);
};

const buildAuth = (urlp: URL) => {
	const username = urlp.username;
	const password = urlp.password;

	return username ? username + (password ? ':' + password : '') + '@' : '';
};
