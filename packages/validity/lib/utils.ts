import type { Key, PathType } from './types.ts';

export const pushPath = (path: PathType, next: Key): Key[] => {
	return path ? path.concat(next) : [next];
};
