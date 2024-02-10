import { lazy } from 'solid-js';

import { createRouter } from '@pkg/solid-navigation';

const HANDLE_OR_DID_RE =
	/^@([a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*(?:\.[a-zA-Z]{2,}))|did:[a-z]+:[a-zA-Z0-9._\-]+$/;

const TID_RE = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

const isValidHandleOrDid = (handleOrDid: string) => {
	return HANDLE_OR_DID_RE.test(handleOrDid);
};
const isValidTid = (tid: string) => {
	return tid.length === 13 && TID_RE.test(tid);
};

export const { RouterView, getMatchedRoute, useParams } = createRouter({
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
			path: '/:ident',
			component: lazy(() => import('~/mobile/views/Profile')),
			validate: (params) => {
				return isValidHandleOrDid(params.ident);
			},
		},
		{
			path: '/:ident/:post',
			component: lazy(() => import('~/mobile/views/Thread')),
			validate: (params) => {
				return isValidHandleOrDid(params.ident) && isValidTid(params.post);
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
