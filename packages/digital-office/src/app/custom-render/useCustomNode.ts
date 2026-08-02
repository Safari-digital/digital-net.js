import * as React from 'react';

export type DnCustomViewEntity = string;
export type DnCustomView = 'edit:tab:general:before' | 'edit:tab:general:after' | 'home:before' | 'home:after';
export type DnCustomViewDict = Partial<Record<DnCustomViewEntity, Partial<Record<DnCustomView, React.ReactNode>>>>;

export const CustomRenderContext = React.createContext<DnCustomViewDict>({});

export function useCustomNode() {
    const dict = React.useContext(CustomRenderContext);
    const renderCustomNode = React.useCallback(
        ({ entity, view }: { entity: DnCustomViewEntity; view: DnCustomView }) => dict[entity]?.[view],
        [dict]
    );
    return {
        dict,
        renderCustomNode,
    };
}
