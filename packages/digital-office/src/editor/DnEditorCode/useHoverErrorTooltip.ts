import * as React from 'react';
import type { Ace } from 'ace-builds';
import { rowColToOffset } from './ace';
import type { ResolvedMarker } from './plugins';

export interface HoverError {
    message: string;
    x: number;
    y: number;
}

export function useHoverErrorTooltip(
    containerRef: React.RefObject<HTMLElement | null>,
    editor: Ace.Editor | null,
    markers: ResolvedMarker[]
): HoverError | null {
    const [hover, setHover] = React.useState<HoverError | null>(null);
    const markersRef = React.useRef<ResolvedMarker[]>(markers);

    React.useEffect(() => {
        markersRef.current = markers;
    }, [markers]);

    const hasMarkers = markers.length > 0;

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container || !editor || !hasMarkers) return;

        const handleMove = (event: MouseEvent) => {
            const ms = markersRef.current;
            if (ms.length === 0) {
                setHover(prev => (prev ? null : prev));
                return;
            }
            const renderer = editor.renderer as unknown as {
                screenToTextCoordinates: (_x: number, _y: number) => { row: number; column: number };
            };
            const { row, column } = renderer.screenToTextCoordinates(event.clientX, event.clientY);
            const offset = rowColToOffset(editor.getValue(), row, column);
            const match = ms.find(m => offset >= m.start && offset < m.end);
            if (match) {
                setHover({ message: match.message, x: event.clientX, y: event.clientY });
            } else {
                setHover(prev => (prev ? null : prev));
            }
        };
        const handleLeave = () => setHover(null);

        container.addEventListener('mousemove', handleMove);
        container.addEventListener('mouseleave', handleLeave);
        return () => {
            container.removeEventListener('mousemove', handleMove);
            container.removeEventListener('mouseleave', handleLeave);
        };
    }, [containerRef, editor, hasMarkers]);

    return hasMarkers ? hover : null;
}
