import type { SxProps, Theme } from '@mui/material';

export interface DnEditorBaseProps {
    value: string;
    onChange: (_value: string) => void;
    disabled?: boolean;
    error?: boolean;
    sx?: SxProps<Theme>;
    getInitialScrollTop?: () => number;
    onScrollTopChange?: (_top: number) => void;
}

export type DnEditorLanguage = 'javascript' | 'html' | 'css' | 'json' | 'jsonld';

export interface DnEditorTemplateVariable {
    token: string;
    source: string;
    field: string;
}
