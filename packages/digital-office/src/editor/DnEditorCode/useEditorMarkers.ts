import * as React from 'react';
import type { Ace } from 'ace-builds';
import { AceRange, offsetToRowCol } from './ace';
import type { EditorPlugin, ResolvedMarker } from './plugins';

const DEBOUNCE_MS = 250;

export function useEditorMarkers(editor: Ace.Editor | null, value: string, plugins: EditorPlugin[]): ResolvedMarker[] {
    const [debouncedMarkers, setDebouncedMarkers] = React.useState<ResolvedMarker[]>([]);
    const markerIdsRef = React.useRef<number[]>([]);

    const hasValidators = plugins.some(p => p.validate);

    React.useEffect(() => {
        if (!editor) return;

        const clear = () => {
            for (const id of markerIdsRef.current) editor.session.removeMarker(id);
            markerIdsRef.current = [];
        };

        const validators = plugins.filter(p => p.validate);
        if (validators.length === 0) {
            clear();
            return;
        }

        let aborted = false;
        const timer = window.setTimeout(() => {
            if (aborted) return;
            clear();
            const resolved: ResolvedMarker[] = [];
            for (const plugin of validators) {
                const errs = plugin.validate!(value);
                for (const err of errs) {
                    const start = offsetToRowCol(value, err.start);
                    const end = offsetToRowCol(value, err.end);
                    const range = new AceRange(start.row, start.column, end.row, end.column);
                    const id = editor.session.addMarker(range, err.className, 'text', false);
                    markerIdsRef.current.push(id);
                    resolved.push({ ...err, pluginId: plugin.id });
                }
            }
            setDebouncedMarkers(resolved);
        }, DEBOUNCE_MS);

        return () => {
            aborted = true;
            window.clearTimeout(timer);
        };
    }, [editor, value, plugins]);

    return React.useMemo(() => (hasValidators ? debouncedMarkers : []), [hasValidators, debouncedMarkers]);
}
