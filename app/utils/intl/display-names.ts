export const languageNames = new Intl.DisplayNames('en-US', { type: 'language' });
export const languageNamesStrict = new Intl.DisplayNames('en-US', { type: 'language', fallback: 'none' });

export const getNativeLanguageName = (code: string) => {
	return new Intl.DisplayNames(code, { type: 'language' }).of(code);
};
