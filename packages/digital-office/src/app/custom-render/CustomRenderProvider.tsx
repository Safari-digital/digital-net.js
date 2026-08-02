import * as React from 'react';
import { useEntityContext } from '../../entity/useEntityContext';
import { CustomRenderContext, type DnCustomViewDict } from './useCustomNode';

/** Slot keys that are views rather than entities. */
const RESERVED_KEYS = ['home'];

export function CustomRenderProvider({
    customRender = {},
    children,
}: {
    children: React.ReactNode;
    customRender?: DnCustomViewDict;
}) {
    const { entities } = useEntityContext();

    // The dictionary is keyed by plain strings, so a key that matches no entity renders nothing at
    // all rather than failing — warn instead of letting it pass silently.
    React.useEffect(() => {
        const unknown = Object.keys(customRender).filter(key => !(key in entities) && !RESERVED_KEYS.includes(key));
        if (unknown.length > 0) {
            console.warn(
                `[digital-office] customRender targets unknown entities: ${unknown.join(', ')}. Entity keys are the backend entity types, e.g. "Article".`
            );
        }
    }, [customRender, entities]);

    return <CustomRenderContext.Provider value={customRender}>{children}</CustomRenderContext.Provider>;
}
