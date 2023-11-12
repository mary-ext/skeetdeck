export const PreferenceIgnore = 1;
export const PreferenceWarn = 2;
export const PreferenceHide = 3;

export type LabelPreference = 1 | 2 | 3;
export type KeywordPreference = 1 | 2 | 3;

export const ActionBlur = 1;
export const ActionBlurMedia = 2;
export const ActionAlert = 3;

export type LabelAction = 1 | 2 | 3;

export const FlagNoOverride = 1 << 0;

export type LabelFlag = 1;
