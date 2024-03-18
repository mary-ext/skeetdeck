import type { ModerationCause } from '..';

export type CachedModerationResult = { r: ModerationCause[]; c: unknown[] };

export const cache = new WeakMap<WeakKey, CachedModerationResult>();
