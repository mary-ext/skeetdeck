export const systemLanguages: string[] = [];

for (const lang of navigator.languages) {
	const index = lang.indexOf('-');
	const code2 = index !== -1 ? lang.slice(0, index) : lang;

	if (systemLanguages.includes(code2)) {
		continue;
	}

	systemLanguages.push(code2);
}
