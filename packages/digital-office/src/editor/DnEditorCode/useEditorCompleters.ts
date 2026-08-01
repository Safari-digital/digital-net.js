import * as React from 'react';
import type { Ace } from 'ace-builds';
import type { EditorPlugin } from './plugins';

interface AceCompleterRegistry {
    completers?: unknown[];
}

const defaultCompleterSnapshots = new WeakMap<Ace.Editor, unknown[] | undefined>();

export function useEditorCompleters(editor: Ace.Editor | null, plugins: EditorPlugin[]): void {
    React.useEffect(() => {
        if (!editor) return;
        const reg = editor as unknown as AceCompleterRegistry;

        // Snapshot ACE's default completer chain once so we can restore it later.
        if (!defaultCompleterSnapshots.has(editor)) {
            defaultCompleterSnapshots.set(editor, reg.completers);
        }
        const defaults = defaultCompleterSnapshots.get(editor) ?? [];

        let base: unknown[] = defaults;
        for (const p of plugins) {
            if (p.replacesDefaultCompleters && p.completers) {
                base = p.completers;
            }
        }

        const prepended = plugins.filter(p => !p.replacesDefaultCompleters).flatMap(p => p.completers ?? []);

        // ACE exposes its completer chain as a writable public property; the lint rule
        // can't see past the cast, so silence it for the documented mutation.
        // eslint-disable-next-line react-hooks/immutability
        reg.completers = [...prepended, ...base];

        return () => {
            const snap = defaultCompleterSnapshots.get(editor);
            if (snap) reg.completers = snap;
        };
    }, [editor, plugins]);
}
