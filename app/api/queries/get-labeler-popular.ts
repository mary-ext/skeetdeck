import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { AppBskyLabelerDefs, At } from '../atp-schema';
import { publicAppView } from '../globals/agent';

// Hardcoded list of DIDs for now.
// https://github.com/mary-ext/bluesky-labelers/blob/3dfabe0002256ff5c03f419ba51bd091891ca4fc/did.min.json
const dids = [
	'did:plc:j67mwmangcbxch7knfm7jo2b',
	'did:plc:bpkpvmwpd3nr2ry4btt55ack',
	'did:plc:newitj5jo3uel7o4mnf3vj2o',
	'did:plc:smtbhjnwsvcxzvez2nbf7mar',
	'did:plc:i65enriuag7n5fgkopbqtkyk',
	'did:plc:wp7hxfjl5l4zlptn7y6774lk',
	'did:plc:mjyeurqmqjeexbgigk3yytvb',
	'did:plc:5o2g6wwchb3tgwrhl2atauzu',
	'did:plc:vrjubqujt3v46z5poehh4qfg',
	'did:plc:jcce2sa3fgue4wiocvf7e7xj',
	'did:plc:3ehw5dwwptcy3xuzugwq2u6t',
	'did:plc:vnzvtgtwden4hpeierfcfan2',
	'did:plc:36inn6r2ttwfrt6tpywsjcmt',
	'did:plc:5bs7ob2txc2fub2ikvkjgkaf',
	'did:plc:z2i5ah5elywxdcr64i7xai3z',
	'did:plc:e4elbtctnfqocyfcml6h2lf7',
	'did:plc:3eivfiql4memqxkryeu4tqnk',
	'did:web:genco.me',
	'did:plc:fcikraffwejtuqffifeykcml',
	'did:plc:oz5zavafp7szpd2yyko57ccz',
	'did:plc:skibpmllbhxvbvwgtjxl3uao',
	'did:plc:j2zujaxuq33c7nbcqyvgvyvk',
	'did:plc:4vf7tgwlg6edds2g2nixyjda',
	'did:plc:gcbmhqcuvuoz7jgmlanabiuv',
	'did:plc:nyfwpkztgsrbhrjewnw2p7yo',
	'did:plc:7fkqmr7dfu6vanyxvjtloos3',
	'did:plc:e2pq4mw6ivyle3lavxptuh56',
	'did:plc:cnn3jrtucivembf66xe6fdfs',
	'did:plc:z7wmj3d5t7ytjf4nrh5nq6zx',
	'did:plc:3o4ajsgts2fsuexm5ai6wln5',
	'did:plc:hxgctysbwhc3bap3a5c7gdu3',
	'did:plc:j3axwmdgrvnd73yrlemynsne',
	'did:plc:ar7c4by46qjdydhdevvrndac',
	'did:plc:exlb5xx2t4pgtjqzdm6ntsgh',
	'did:plc:gq3qf7nawgpkt6co7z62fnqm',
	'did:plc:hjhlwomi2kwyrss5w5i5l7xq',
	'did:plc:l2s5mv6h2j5gyoacsxdxdfom',
	'did:plc:mcskx665cnmnkgqnunk6lkrk',
	'did:plc:olmiw2wkm3qoxinal7w5fbnl',
	'did:plc:rprd6z2sgvsdokjsbadytyun',
	'did:plc:zpkpugmisg3tv5as5almklq6',
	'did:plc:3wabolcdllw3w5lnwbrrlp7z',
	'did:plc:babjybnpnxc3ri55rjil2zz3',
	'did:plc:orkjknb6lx4snybzwsolhatt',
	'did:plc:qjehb7vyu2hw7mtm4qjsh4h4',
	'did:plc:coynarrmyjsm2s3zkbbr5iow',
	'did:plc:d5dgzxlv5pbpwzkahhdexoce',
	'did:plc:fckjqanjagumq5qw4ozwj7go',
	'did:plc:lydl7umexooxibfhdtwcijn2',
	'did:plc:pozgajl56zcftf6nzps46z65',
];

export const getLabelerPopularKey = () => {
	return ['/getLabelerPopular'];
};
export const getLabelerPopular = async (
	ctx: QC<ReturnType<typeof getLabelerPopularKey>, number | undefined>,
) => {
	const limit = 10;

	const start = ctx.pageParam || 0;
	const end = start + limit;

	const sliced = dids.slice(start, end) as At.DID[];
	const remaining = dids.length - end;

	const response = await publicAppView.get('app.bsky.labeler.getServices', {
		signal: ctx.signal,
		params: {
			dids: sliced,
		},
	});

	const views = response.data.views as AppBskyLabelerDefs.LabelerView[];

	return {
		cursor: remaining > 0 ? end : undefined,
		views: views,
	};
};
