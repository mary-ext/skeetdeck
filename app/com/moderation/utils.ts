import type { SignalizedPost } from '~/api/stores/posts.ts';

export const isPostModerated = (post: SignalizedPost) => {
	if (post.uid !== post.author.did) {
		// Post author isn't the viewer, not applicable.
		return false;
	}

	const recordLabels = post.record.value.labels?.values;
	const viewLabels = post.labels.value;

	if (!viewLabels || viewLabels.length === 0) {
		// View doesn't contains a label, not applicable.
		return false;
	}

	if (!recordLabels || recordLabels.length === 0) {
		// View contains a label, but record doesn't, applicable.
		return true;
	}

	// Applicable if view has a label that record does not.
	const set = new Set<string>();

	for (const label of viewLabels) {
		set.add(label.val);
	}
	for (const label of recordLabels) {
		set.delete(label.val);
	}

	return set.size !== 0;
};
