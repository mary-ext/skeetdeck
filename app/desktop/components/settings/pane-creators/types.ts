import type { DID } from '~/api/atp-schema.ts';

import type { PaneConfig } from '../../../globals/panes.ts';

export type AddFn = <T extends PaneConfig>(partial: Omit<T, 'id' | 'size' | 'uid'>) => void;

export interface PaneCreatorProps {
	uid: DID;
	onAdd: AddFn;
}
