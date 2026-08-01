import type { Theme } from '@mui/material';
import type { Ace } from 'ace-builds';

export function resolveEditorTheme(editor: Ace.Editor, theme: Theme) {
    const aceTheme = theme.palette.mode === 'dark' ? 'monokai' : 'github_light_default';
    editor.setTheme(`ace/theme/${aceTheme}`);
}
