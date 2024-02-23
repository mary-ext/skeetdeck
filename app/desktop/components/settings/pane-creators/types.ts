import type { At } from '~/api/atp-schema';

import type { PaneConfig } from '../../../globals/panes';

export type AddFn = <T extends PaneConfig>(partial: Omit<T, 'id' | 'size' | 'title' | 'uid'>) => void;

export interface PaneCreatorProps {
	uid: At.DID;
	onAdd: AddFn;
}
