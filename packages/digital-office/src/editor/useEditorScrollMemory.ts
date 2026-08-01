import * as React from 'react';

// Switching editors unmounts the previous one, which drops its scroll position. Keep one offset
// per mode here so coming back lands where the user left off. Ace ignores a scrollTop written on
// its DOM scrollbar, so each editor reports and restores its own offset.
export function useEditorScrollMemory<T extends string>(mode: T) {
    const scrollTops = React.useRef({} as Record<T, number>);
    return {
        getInitialScrollTop: () => scrollTops.current[mode] ?? 0,
        onScrollTopChange: (top: number) => void (scrollTops.current[mode] = top),
    };
}
