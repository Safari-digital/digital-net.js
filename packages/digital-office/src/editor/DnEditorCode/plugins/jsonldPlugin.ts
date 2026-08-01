import type { Ace } from 'ace-builds';
import { JSONCompletion } from '../JSONCompletion';
import { JSONValidator } from '../JSONValidator';
import type { EditorPlugin } from './types';

const jsonldCompletion = new JSONCompletion();

const jsonldAceCompleter: unknown = {
    identifierRegexps: [/[@a-zA-Z_0-9\-:/.]/],
    getCompletions(
        _editor: Ace.Editor,
        session: Ace.EditSession,
        pos: { row: number; column: number },
        _prefix: string,
        callback: (_err: Error | null, _items: unknown[]) => void
    ) {
        callback(null, jsonldCompletion.getCompletions(session, pos));
    },
};

export const jsonldPlugin: EditorPlugin = {
    id: 'jsonld',
    validate: value =>
        new JSONValidator().validate(value).map(err => ({
            start: err.range.start,
            end: err.range.end,
            message: err.message,
            className: err.severity === 'warning' ? 'dn-jsonld-warning' : 'dn-jsonld-error',
        })),
    completers: [jsonldAceCompleter],
    replacesDefaultCompleters: true,
    autocompleteTriggers: [{ pattern: '"' }],
};
