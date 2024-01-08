import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';

import { getDraftDb, type ComposerDraft } from '../../utils/draft-db.ts';

export interface DeleteDraftDialogProps {
	draft: ComposerDraft;
	onDelete: () => void;
}

const DeleteDraftDialog = (props: DeleteDraftDialogProps) => {
	const draft = props.draft;

	return (
		<ConfirmDialog
			title={`Delete draft?`}
			body={
				<>
					<b>{/* @once */ draft.title}</b> will be deleted, this can't be undone.
				</>
			}
			confirmation="Delete"
			onConfirm={() => {
				const dbp = getDraftDb();
				dbp.then((db) => db.delete('drafts', draft.id)).then(() => props.onDelete());
			}}
		/>
	);
};

export default DeleteDraftDialog;
