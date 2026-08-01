import type { Ace } from 'ace-builds';
import type { DnEditorLanguage } from '../../types';

const aceModesMap: Record<DnEditorLanguage, string> = {
    javascript: 'javascript',
    html: 'html',
    css: 'css',
    json: 'json',
    jsonld: 'json',
};

export function resolveEditorLanguage(editor: Ace.Editor, language: DnEditorLanguage) {
    editor.session.setMode(`ace/mode/${aceModesMap[language]}`);
}
