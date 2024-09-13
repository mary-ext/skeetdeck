import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { publicAppView } from '../globals/agent';

// Hardcoded list of DIDs for now.
// https://github.com/mary-ext/bluesky-labelers
const dids: string[] = [
	'did:plc:hysbs7znfgxyb4tsvetzo4sk', // bskyttrpg.bsky.social
	'did:plc:yojwcfgpkxq35sv5wioglqad', // perisai.bsky.social
	'did:plc:bpkpvmwpd3nr2ry4btt55ack', // aimod.social
	'did:plc:wkoofae5uytcm7bjncmev6n6', // pronouns.adorable.mom
	'did:plc:aksxl7qy5azlzfm2jstcwqtz', // kiki-bouba.mozzius.dev
	'did:plc:2qawvcwumvgxmed6iy6pmt6l', // sonasky.bsky.social
	'did:plc:roh5lg5iwlwfo2y4rsesjt4p', // pronomezinhos.felina.fish
	'did:plc:3gtp7uvt63bwostaypbcb7ur', // etiquetasdoorkut.bsky.social
	'did:plc:i65enriuag7n5fgkopbqtkyk', // profile-labels.bossett.social
	'did:plc:4ugewi6aca52a62u62jccbl7', // asukafield.xyz
	'did:plc:newitj5jo3uel7o4mnf3vj2o', // xblock.aendra.dev
	'did:plc:e4elbtctnfqocyfcml6h2lf7', // labeler.mountainherder.xyz
	'did:plc:dsae6lz5garrdkbicuor4chs', // ozone.birb.house
	'did:plc:z3yk2cflhmn6vmzo3f5ixqh4', // yardcrow.com
	'did:plc:yv4nuaj3jshcuh2d2ivykgiz', // sortinghat.bsky.sh
	'did:plc:zal76px7lfptnpgn4j3v6i7d', // dev-labels.bsky.social
	'did:plc:fqfzpua2rp5io5nmxcixvdvm', // oracle.posters.rip
	'did:plc:wp7hxfjl5l4zlptn7y6774lk', // baatl.mastod.one
	'did:plc:smtbhjnwsvcxzvez2nbf7mar', // cryptolabeler.w3igg.com
	'did:plc:jcce2sa3fgue4wiocvf7e7xj', // labeler.flicknow.xyz
	'did:plc:lcdcygpdeiittdmdeddxwt4w', // laelaps.fyi
	'did:plc:ubt73xes4uesthuuhbqwf37d', // kickflip.renahlee.com
	'did:plc:mjyeurqmqjeexbgigk3yytvb', // nogifsplease.bsky.social
	'did:plc:o47jwym4ufayfdpvwniablaa', // comunidade.lgbt
	'did:plc:cdbp64nijvsmhuhodbuoqcwi', // zodiacsigns.bsky.sh
	'did:plc:mpogduvvraozdcbp6w2lafqg', // warlabel.bsky.social
	'did:plc:36inn6r2ttwfrt6tpywsjcmt', // phobial.mastod.one
	'did:plc:5o2g6wwchb3tgwrhl2atauzu', // moderation.tripazeada.club
	'did:plc:7m7xz5ekdmw3tephpgn72ooz', // moods.fran.pw
	'did:plc:5bs7ob2txc2fub2ikvkjgkaf', // labeller.iftas.org
	'did:plc:3ehw5dwwptcy3xuzugwq2u6t', // stopthebeans.haileyok.com
	'did:plc:3eivfiql4memqxkryeu4tqnk', // mod.shawn.party
	'did:plc:eeptyms6w2crpi6h73ok7qjt', // labeler.shreyanjain.net
	'did:plc:vnzvtgtwden4hpeierfcfan2', // atproto-spoilers.bsky.social
	'did:plc:skibpmllbhxvbvwgtjxl3uao', // anti-aging.bsky.social
	'did:plc:rfymv3uqbppip7fq4i4zhhdi', // dcheros.bsky.social
	'did:plc:fro6kbnitc47ia5x23ds4o3b', // arta.mobik.zip
	'did:plc:cnn3jrtucivembf66xe6fdfs', // moderation.moe
	'did:plc:f7fr3fmpevkmhodlzktuobvx', // engagement-hacks.bsky.social
	'did:plc:chk262mwftsprs3dgzpijywo', // perfect-bra.in
	'did:plc:fcikraffwejtuqffifeykcml', // ff14labeler.bsky.social
	'did:plc:z2i5ah5elywxdcr64i7xai3z', // lavka.bsky.social
	'did:plc:pxowo44mhyygxdbfssz5w3xv', // jobstone.aparker.io
	'did:plc:6kv3w5n5oehbntjpm7izgpy2', // kind-labeler.bsky.social
	'did:plc:gcbmhqcuvuoz7jgmlanabiuv', // label.goeo.lol
	'did:plc:4ffrdzuhiq4coouadh5btkbf', // papercut.rodeo
	'did:plc:hwmrwmykflexnxm32pdat5gq', // courtesybot.bsky.social
	'did:plc:olmiw2wkm3qoxinal7w5fbnl', // blue-cosmos.bsky.social
	'did:plc:qezlipqc4yfk2lebu7533zyr', // newsdetective.bsky.social
	'did:plc:likrwr4zffx6ph4ishw7iuwi', // automo.bsky.social
	'did:plc:oz5zavafp7szpd2yyko57ccz', // divylabeler.bsky.social
	'did:plc:z7wmj3d5t7ytjf4nrh5nq6zx', // lapor.bsky.social
	'did:plc:e2pq4mw6ivyle3lavxptuh56', // ohnozone.bsky.social
	'did:plc:bxnuth7kms5l57v2milp5gb3', // uspol.blakeslabs.com
	'did:plc:nyfwpkztgsrbhrjewnw2p7yo', // labeler.dovgonosyk.xyz
	'did:plc:doqrpcaai4iqmkbdo3ztmlld', // danielhe4rtless.bsky.social
	'did:plc:bqaoaao7n5qqv2pf7rtyncqs', // department7.org
	'did:plc:bv3lcacietc6fkdokxfqtdkj', // nunnybabbit.bsky.social
	'did:plc:657bbv43hgcuypiqbkuuiz4s', // silencebrand.bsky.social
	'did:plc:j2zujaxuq33c7nbcqyvgvyvk', // nexus-labeler.bsky.social
	'did:plc:3ej5knrqezo3meltfsb4vwnv', // tda-labeler.bsky.social
	'did:plc:an6ro7od3invm4vowxehbrdz', // hbms.hexandcube.eu.org
	'did:plc:4vf7tgwlg6edds2g2nixyjda', // labeler-test.bsky.day
	'did:plc:qjehb7vyu2hw7mtm4qjsh4h4', // peopleofnz.bsky.social
	'did:plc:d4qkzogjiqnn4uekdxh3pzda', // togepi.skiddle.id
	'did:plc:3o4ajsgts2fsuexm5ai6wln5', // mombot.at.dingdongdata.com
	'did:plc:ar7c4by46qjdydhdevvrndac', // moderation.bsky.app
	'did:plc:iohl2upkd2anlxuzhyottpow', // nn.erbs.fun
	'did:plc:j2f7hqwhrstdmtidaslcaqjd', // idollabeler.bsky.social
	'did:plc:3senheyfatcgrq5b2diwxlgs', // marklabeler3.bsky.social
	'did:plc:6dla7xy2kvakqvhj566tmwbe', // teans.bsky.my
	'did:plc:2qhdv5xwffbogrfoqcqzpady', // labeler.procycling.social
	'did:plc:7fkqmr7dfu6vanyxvjtloos3', // hblabeler.bsky.social
	'did:plc:j3axwmdgrvnd73yrlemynsne', // labeler.launchpadx.top
	'did:plc:exlb5xx2t4pgtjqzdm6ntsgh', // exml.bsky.social
	'did:plc:cug2evrqa3nhdbvlfd2cvtky', // flatlander.social
	'did:plc:vxd7emodzngyyq5ep3yz56if', // guildabrazuca.bsky.social
	'did:plc:rprd6z2sgvsdokjsbadytyun', // labels.lio.systems
	'did:plc:g32y26ik6jdm622iahfmc24h', // ordemlabels.rapazeada.chat
	'did:plc:coynarrmyjsm2s3zkbbr5iow', // yonatanlabel.bsky.social
	'did:plc:sfmhk6dn2gf5ccikj32divqf', // creatorcontent.bsky.social
	'did:plc:ekitcvx7uwnauoqy5oest3hm', // infra-service-br.bsky.social
	'did:plc:orkjknb6lx4snybzwsolhatt', // labeler.bsky.imax.in.ua
	'did:plc:l2s5mv6h2j5gyoacsxdxdfom', // labeler.divy.zone
	'did:plc:fjc6iykjrk3tia3eqv3rsmoh', // cblol.andrefelippe.com
	'did:plc:3wabolcdllw3w5lnwbrrlp7z', // topical-moderation.bsky.social
	'did:plc:pozgajl56zcftf6nzps46z65', // abandoned293487398.bsky.social
	'did:plc:tu62rstdbbl7iv4zyylnf6ne', // clacks.bsky.social
	'did:web:de1.tentacle.expert', // de1.pds.tentacle.expert
	'did:plc:jwqm25l6zbkgmorz3k35hf32', // curationkeeper.bsky.social
	'did:plc:d5dgzxlv5pbpwzkahhdexoce', // gifblock.flop.quest
	'did:plc:e6yuq5ro3biqomd5p4ei4mcn', // divylabeler2.bsky.social
	'did:plc:d26oolevqznqar5vjjkkkcwa', // moderation.foxhole.lgbt
	'did:plc:wi66yiihb7hcnmgkvtmfd3ht', // handle.invalid
	'did:plc:z5b7do4yl7afp7mtida66nts', // labeler.hellthread.pro
	'did:plc:g3purpufjxeuqcckyv3kmqbs', // labeloo.bsky.social
	'did:plc:ilk6ylazu4bfhtpryjha3kn6', // letmebook.bsky.social
	'did:plc:zpkpugmisg3tv5as5almklq6', // labeler.lotor.online
	'did:plc:fckjqanjagumq5qw4ozwj7go', // matsui0000.bsky.social
	'did:plc:dv5alzz7dy3ihum5nwpcuk63', // ozone.pds.skyfeed.dev
	'did:plc:wcj2r6a4mmedpwxgqcgeyoy6', // gorttars.bsky.social
	'did:plc:vs6psq72k2t6hdcxrpqj5p4p', // ripperonitester.bsky.social
	'did:plc:hjhlwomi2kwyrss5w5i5l7xq', // moderation.sunaba.network
	'did:plc:gq3qf7nawgpkt6co7z62fnqm', // mod.armifi.com
	'did:plc:lydl7umexooxibfhdtwcijn2', // moderation.veryun.cool
	'did:plc:xsgiyyuwk4k4ai7bgxia3efm', // testing-labeler.bsky.social
	'did:plc:mcskx665cnmnkgqnunk6lkrk', // wyvern.blue
	'did:plc:jmaugwkq7v64luptuid7spt6', // labels.zio.blue
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
