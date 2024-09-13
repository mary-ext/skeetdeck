import type { At } from '@atcute/client/lexicons';

import type { PaneConfig } from '../../../globals/panes';

export type AddFn = <T extends PaneConfig>(partial: Omit<T, 'id' | 'size' | 'title' | 'uid'>) => void;

export interface PaneCreatorProps {
	uid: At.DID;
	onAdd: AddFn;
}
