import { lazy } from 'solid-js';

import { configureRouter } from '@pkg/solid-navigation';

const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._\-]+$/;

const HANDLE_OR_DID_RE =
	/^@([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]{2,}))|did:[a-z]+:[a-zA-Z0-9._\-]+$/;

const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

const isValidDid = (did: string) => {
	return DID_RE.test(did);
};
const isValidHandleOrDid = (handleOrDid: string) => {
	return HANDLE_OR_DID_RE.test(handleOrDid);
};
const isValidTid = (tid: string) => {
	return tid.length === 13 && TID_RE.test(tid);
};

configureRouter({
	routes: [
		{
			path: '/',
			component: lazy(() => import('~/mobile/views/Home')),
			single: true,
			meta: {
				name: 'Home',
				main: true,
			},
		},
		{
			path: '/explore',
			component: lazy(() => import('~/mobile/views/Explore')),
			single: true,
			meta: {
				name: 'Explore',
				main: true,
			},
		},
		{
			path: '/notifications',
			component: lazy(() => import('~/mobile/views/Notifications')),
			single: true,
			meta: {
				name: 'Notifications',
				main: true,
			},
		},
		{
			path: '/@me',
			component: lazy(() => import('~/mobile/views/Me')),
			single: true,
			meta: {
				name: 'Me',
				main: true,
			},
		},

		{
			path: '/:actor',
			component: lazy(() => import('~/mobile/views/Profile')),
			validate: (params) => {
				return isValidDid(params.actor);
			},
		},
		{
			path: '/:actor/:post',
			component: lazy(() => import('~/mobile/views/Thread')),
			validate: (params) => {
				return isValidDid(params.actor) && isValidTid(params.post);
			},
		},
		{
			path: '*',
			component: lazy(() => import('~/mobile/views/NotFound')),
			meta: {
				name: 'NotFound',
			},
		},
	],
});
