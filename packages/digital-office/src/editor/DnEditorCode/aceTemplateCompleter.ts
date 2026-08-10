import type { Ace } from 'ace-builds';
import ace from 'ace-builds/src-noconflict/ace';
import type { DnEditorTemplateVariable } from '../types';

interface AceRangeCtor {
    new (_startRow: number, _startCol: number, _endRow: number, _endCol: number): Ace.Range;
}

const AceRange = (ace as unknown as { require: (_: string) => { Range: AceRangeCtor } }).require('ace/range').Range;

/** Mirrors the interpolation grammar: `{{ article.metaTitle ?? article.title }}`. */
const FALLBACK_SEPARATOR = '??';

interface TemplateCompletion {
    caption: string;
    value: string;
    meta: string;
    score: number;
    completer: { insertMatch: (_editor: Ace.Editor, _data: TemplateCompletion) => void };
}

export function createTemplateCompleter(variables: DnEditorTemplateVariable[]): unknown {
    const completer = {
        identifierRegexps: [/[@a-zA-Z_0-9.{}\-:/]/],
        getCompletions(
            _editor: Ace.Editor,
            session: Ace.EditSession,
            pos: { row: number; column: number },
            _prefix: string,
            callback: (_err: Error | null, _items: TemplateCompletion[]) => void
        ) {
            if (variables.length === 0) return callback(null, []);

            const line = session.getLine(pos.row).slice(0, pos.column);
            const open = line.lastIndexOf('{{');
            const close = line.lastIndexOf('}}');
            if (open === -1 || (close !== -1 && close > open)) return callback(null, []);

            const insertMatch = (editor: Ace.Editor, data: TemplateCompletion) => {
                const cursor = editor.getCursorPosition();
                const lineToCursor = editor.session.getLine(cursor.row).slice(0, cursor.column);
                const openIdx = lineToCursor.lastIndexOf('{{');
                if (openIdx === -1) {
                    editor.insert(data.value);
                    return;
                }
                // Inside a fallback chain only the term being typed is replaced, and it carries no
                // braces of its own — they already opened the token.
                const fallbackIdx = lineToCursor.lastIndexOf(FALLBACK_SEPARATOR);
                const insideChain = fallbackIdx > openIdx;
                const from = insideChain ? fallbackIdx + FALLBACK_SEPARATOR.length : openIdx;
                const value = insideChain ? ` ${data.value.replace(/^\{\{\s*|\s*\}\}$/g, '')}` : data.value;
                const range = new AceRange(cursor.row, from, cursor.row, cursor.column);
                editor.session.replace(range, value);
            };

            const items: TemplateCompletion[] = variables.map(v => ({
                caption: v.token,
                value: v.token,
                meta: `${v.source}.${v.field}`,
                score: 1000,
                completer: { insertMatch },
            }));
            callback(null, items);
        },
    };
    return completer;
}
