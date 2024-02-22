import { lazy } from 'solid-js';

import { configureRouter } from '@pkg/solid-navigation';

const DID_RE = /^did:[a-z]+:[a-zA-Z0-9._\-]+$/;
const HANDLE_RE = /^@([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]{2,}))$/;

const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

const isValidDid = (did: string) => {
	return DID_RE.test(did);
};
const isValidHandle = (handleOrDid: string) => {
	return HANDLE_RE.test(handleOrDid);
};
const isValidTid = (tid: string) => {
	return tid.length === 13 && TID_RE.test(tid);
};

configureRouter({
	routes: [
		{
			path: '/',
			component: lazy(() => import('~/mobile/views/LoggedOut')),
			meta: {
				public: true,
			},
		},
		{
			path: '/sign_in',
			component: lazy(() => import('~/mobile/views/SignIn')),
			meta: {
				public: true,
			},
		},

		{
			path: '/home',
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
				public: true,
			},
		},
	],
});
