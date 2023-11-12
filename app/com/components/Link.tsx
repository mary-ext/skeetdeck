import { type JSX, createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

export enum LinkingType {
	EXTERNAL,
	POST_LIKED_BY,
	POST_REPOSTED_BY,
	POST,
	PROFILE_FEED,
	PROFILE_LIST,
	PROFILE,
	REPLY,
	TAG,
}

export interface ExternalLinking {
	type: LinkingType.EXTERNAL;
	url: string;
	valid: boolean;
}

export interface PostLikedByLinking {
	type: LinkingType.POST_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface PostRepostedByLinking {
	type: LinkingType.POST_REPOSTED_BY;
	actor: DID;
	rkey: string;
}

export interface PostLinking {
	type: LinkingType.POST;
	actor: DID;
	rkey: string;
}

export interface ProfileFeedLinking {
	type: LinkingType.PROFILE_FEED;
	actor: DID;
	rkey: string;
}

export interface ProfileListLinking {
	type: LinkingType.PROFILE_LIST;
	actor: DID;
	rkey: string;
}

export interface ProfileLinking {
	type: LinkingType.PROFILE;
	actor: DID;
}

export interface ReplyLinking {
	type: LinkingType.REPLY;
	actor: DID;
	rkey: string;
}

export interface TagLinking {
	type: LinkingType.TAG;
	tag: string;
}

export type Linking =
	| ExternalLinking
	| PostLikedByLinking
	| PostRepostedByLinking
	| PostLinking
	| ProfileFeedLinking
	| ProfileListLinking
	| ProfileLinking
	| ReplyLinking
	| TagLinking;

export interface LinkingProps {
	to: Linking;
	ref?: HTMLElement | ((el: HTMLElement) => void);
	class?: string;
	title?: string;
	children?: JSX.Element;
}

export interface LinkingContextObject {
	navigate(to: Linking, alt?: boolean): void;
	render(props: LinkingProps): JSX.Element;
}

export const LinkingContext = createContext<LinkingContextObject>();

export const useLinking = () => {
	return useContext(LinkingContext)!;
};

export const Link = (props: LinkingProps): JSX.Element => {
	const linking = useLinking();

	// @ts-expect-error
	return () => linking.render(props);
};
