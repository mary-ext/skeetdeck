import { Immer } from 'immer';

const immer = new Immer({ autoFreeze: false });

export const produce = immer.produce;
