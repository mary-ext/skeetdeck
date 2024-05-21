import type { SignalizedConvo } from '~/api/stores/convo';

export const isChatDeletedAccount = (convo: SignalizedConvo) => {
	const recipients = convo.recipients.value;
	return recipients.length === 1 && recipients[0].handle.value === 'missing.invalid';
};
