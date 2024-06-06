import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { AppBskyLabelerDefs, At } from '../atp-schema';
import { publicAppView } from '../globals/agent';

// Hardcoded list of DIDs for now.
// https://github.com/mary-ext/bluesky-labelers
const dids: string[] = [
	'did:plc:j67mwmangcbxch7knfm7jo2b', // aegis.blue
	'did:plc:bpkpvmwpd3nr2ry4btt55ack', // aimod.social
	'did:plc:newitj5jo3uel7o4mnf3vj2o', // xblock.aendra.dev
	'did:plc:i65enriuag7n5fgkopbqtkyk', // profile-labels.bossett.social
	'did:plc:smtbhjnwsvcxzvez2nbf7mar', // cryptolabeler.w3igg.com
	'did:plc:e4elbtctnfqocyfcml6h2lf7', // labeler.mountainherder.xyz
	'did:plc:vrjubqujt3v46z5poehh4qfg', // taurusshield.app
	'did:plc:wp7hxfjl5l4zlptn7y6774lk', // baatl.mastod.one
	'did:plc:jcce2sa3fgue4wiocvf7e7xj', // labeler.flicknow.xyz
	'did:plc:mjyeurqmqjeexbgigk3yytvb', // nogifsplease.bsky.social
	'did:plc:z3yk2cflhmn6vmzo3f5ixqh4', // yardcrow.com
	'did:plc:5o2g6wwchb3tgwrhl2atauzu', // moderation.tripazeada.club
	'did:plc:3ehw5dwwptcy3xuzugwq2u6t', // stopthebeans.haileyok.com
	'did:plc:36inn6r2ttwfrt6tpywsjcmt', // phobial.mastod.one
	'did:plc:vnzvtgtwden4hpeierfcfan2', // atproto-spoilers.bsky.social
	'did:plc:5bs7ob2txc2fub2ikvkjgkaf', // labeller.iftas.org
	'did:plc:3eivfiql4memqxkryeu4tqnk', // mod.shawn.party
	'did:plc:eeptyms6w2crpi6h73ok7qjt', // labeler.shreyanjain.net
	'did:plc:z2i5ah5elywxdcr64i7xai3z', // lavka.bsky.social
	'did:plc:cnn3jrtucivembf66xe6fdfs', // moderation.moe
	'did:plc:skibpmllbhxvbvwgtjxl3uao', // anti-aging.bsky.social
	'did:plc:fcikraffwejtuqffifeykcml', // ff14labeler.bsky.social
	'did:plc:olmiw2wkm3qoxinal7w5fbnl', // blue-cosmos.bsky.social
	'did:plc:oz5zavafp7szpd2yyko57ccz', // divylabeler.bsky.social
	'did:plc:j2zujaxuq33c7nbcqyvgvyvk', // nexus-labeler.bsky.social
	'did:plc:gcbmhqcuvuoz7jgmlanabiuv', // label.goeo.lol
	'did:plc:4vf7tgwlg6edds2g2nixyjda', // labeler-test.bsky.day
	'did:plc:nyfwpkztgsrbhrjewnw2p7yo', // labeler.dovgonosyk.xyz
	'did:plc:z7wmj3d5t7ytjf4nrh5nq6zx', // lapor.bsky.social
	'did:plc:e2pq4mw6ivyle3lavxptuh56', // ohnozone.bsky.social
	'did:plc:7fkqmr7dfu6vanyxvjtloos3', // hblabeler.bsky.social
	'did:plc:4ffrdzuhiq4coouadh5btkbf', // papercut.rodeo
	'did:plc:j3axwmdgrvnd73yrlemynsne', // labeler.launchpadx.top
	'did:plc:ar7c4by46qjdydhdevvrndac', // moderation.bsky.app
	'did:plc:exlb5xx2t4pgtjqzdm6ntsgh', // exml.bsky.social
	'did:plc:l2s5mv6h2j5gyoacsxdxdfom', // labeler.divy.zone
	'did:plc:rprd6z2sgvsdokjsbadytyun', // labels.lio.systems
	'did:plc:3o4ajsgts2fsuexm5ai6wln5', // mombot.at.dingdongdata.com
	'did:plc:bqaoaao7n5qqv2pf7rtyncqs', // department7.org
	'did:plc:cug2evrqa3nhdbvlfd2cvtky', // flatlander.social
	'did:plc:orkjknb6lx4snybzwsolhatt', // labeler.bsky.imax.in.ua
	'did:plc:zpkpugmisg3tv5as5almklq6', // labeler.lotor.online
	'did:plc:hjhlwomi2kwyrss5w5i5l7xq', // moderation.sunaba.network
	'did:plc:gq3qf7nawgpkt6co7z62fnqm', // mod.armifi.com
	'did:plc:3wabolcdllw3w5lnwbrrlp7z', // topical-moderation.bsky.social
	'did:plc:mcskx665cnmnkgqnunk6lkrk', // wyvern.blue
	'did:plc:pozgajl56zcftf6nzps46z65', // abandoned293487398.bsky.social
	'did:plc:d5dgzxlv5pbpwzkahhdexoce', // gifblock.flop.quest
	'did:plc:d26oolevqznqar5vjjkkkcwa', // moderation.foxhole.lgbt
	'did:plc:qjehb7vyu2hw7mtm4qjsh4h4', // peopleofnz.bsky.social
	'did:plc:fckjqanjagumq5qw4ozwj7go', // matsui0000.bsky.social
	'did:plc:lydl7umexooxibfhdtwcijn2', // moderation.veryun.cool
	'did:plc:coynarrmyjsm2s3zkbbr5iow', // yonatanlabel.bsky.social
];

export const getLabelerPopularKey = () => {
	return ['/getLabelerPopular'];
};
export const getLabelerPopular = async (
	ctx: QC<ReturnType<typeof getLabelerPopularKey>, number | undefined>,
) => {
	const limit = 25;

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
