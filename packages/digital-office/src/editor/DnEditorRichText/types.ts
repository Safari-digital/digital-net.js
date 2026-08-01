export interface DnEditorRichTextImageAttrs {
    src: string;
    alt: string;
}

export interface DnEditorRichTextImageDialogProps {
    open: boolean;
    initial: DnEditorRichTextImageAttrs | null; // null = insertion, non-null = edition
    onClose: () => void;
    onSubmit: (_attrs: DnEditorRichTextImageAttrs) => void;
}
