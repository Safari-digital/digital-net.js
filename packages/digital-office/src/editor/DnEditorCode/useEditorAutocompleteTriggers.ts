import * as React from 'react';
import type { Ace } from 'ace-builds';
import type { EditorPlugin } from './plugins';

export function useEditorAutocompleteTriggers(editor: Ace.Editor | null, plugins: EditorPlugin[]): void {
    const patternsRef = React.useRef<string[]>([]);

    React.useEffect(() => {
        patternsRef.current = plugins.flatMap(p => (p.autocompleteTriggers ?? []).map(t => t.pattern));
    }, [plugins]);

    React.useEffect(() => {
        if (!editor) return;

        const handler = (delta: { action: string; lines: string[] }) => {
            if (delta.action !== 'insert') return;

            const patterns = patternsRef.current;
            if (patterns.length === 0) return;

            const matched = patterns.some(p => delta.lines.some(l => l.includes(p)));
            if (!matched) return;

            window.setTimeout(() => editor.execCommand('startAutocomplete'), 0);
        };

        editor.on('change', handler);
        return () => {
            editor.off('change', handler);
        };
    }, [editor]);
}
