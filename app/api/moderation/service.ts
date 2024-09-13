import { batch } from 'solid-js';

import { mapDefined } from '~/utils/misc';

import type { AppBskyLabelerDefs } from '../atp-schema';

import {
	BlurContent,
	BlurMedia,
	BlurNone,
	FlagsAdultOnly,
	FlagsNone,
	type LabelBlur,
	type LabelDefinitionMapping,
	type LabelPreference,
	type LabelSeverity,
	type ModerationService,
	PreferenceIgnore,
	PreferenceWarn,
	SeverityAlert,
	SeverityInform,
	SeverityNone,
} from '.';

export const interpretServiceDefinition = (
	service: AppBskyLabelerDefs.LabelerViewDetailed,
): ModerationService => {
	const creator = service.creator;
	const policies = service.policies;

	const values = policies.labelValues;

	const supported = new Set(values);
	const defs: LabelDefinitionMapping = {};

	// Sort the definitions as per labelValues
	for (const def of policies.labelValueDefinitions || []) {
		const id = def.identifier;

		// - Skip system label
		// - Skip if it's not even on labelValues
		if (id[0] === '!' || !supported.has(id)) {
			continue;
		}

		defs[id] = {
			i: id,
			d: convertPreferenceValue(def.defaultSetting),
			b: convertBlurValue(def.blurs),
			s: convertSeverityValue(def.severity),
			f: def.adultOnly ? FlagsAdultOnly : FlagsNone,
			l: mapDefined(def.locales, (locale) => {
				try {
					const parsed = new Intl.Locale(locale.lang);

					return {
						i: parsed.baseName,
						n: locale.name,
						d: locale.description,
					};
				} catch {}
			}),
		};
	}

	return {
		did: creator.did,
		profile: {
			handle: creator.handle,
			avatar: creator.avatar,
			displayName: creator.displayName,
			description: creator.description,
			indexedAt: dateStrToInt(creator.indexedAt),
		},
		prefs: {},
		vals: values,
		defs: defs,
		indexedAt: dateStrToInt(service.indexedAt),
	};
};

export const mergeServiceDefinition = (prev: ModerationService, next: ModerationService) => {
	batch(() => {
		if (prev.indexedAt !== next.indexedAt) {
			prev.indexedAt = next.indexedAt;
			prev.defs = next.defs;
			prev.vals = next.vals;
		}

		if (prev.profile.indexedAt !== next.profile.indexedAt) {
			prev.profile = next.profile;
		}
	});
};

const dateStrToInt = (date: string | undefined) => {
	if (date !== undefined) {
		const parsed = new Date(date).getTime();

		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}
};

const convertPreferenceValue = (value: string | undefined): LabelPreference => {
	if (value === 'warn' || value === 'hide') {
		return PreferenceWarn;
	}

	return PreferenceIgnore;
};

const convertBlurValue = (value: string | undefined): LabelBlur => {
	if (value === 'content') {
		return BlurContent;
	}

	if (value === 'media') {
		return BlurMedia;
	}

	return BlurNone;
};

const convertSeverityValue = (value: string | undefined): LabelSeverity => {
	if (value === 'alert') {
		return SeverityAlert;
	}

	if (value === 'inform') {
		return SeverityInform;
	}

	return SeverityNone;
};
