import * as React from 'react';

export interface DnEntityFormBinding<T> {
    values: Partial<T>;
    apiData?: Partial<T>;
    setField: (_path: string, _value: unknown) => void;
    isDirty: boolean;
    errors?: ReadonlySet<string>;
    disabled?: boolean;
    resetSignal?: number;
}

export const EntityFormContext = React.createContext<DnEntityFormBinding<unknown> | null>(null);

export function useDnEntityFormContext<T>(): DnEntityFormBinding<T> {
    const context = React.useContext(EntityFormContext);
    if (!context) {
        throw new Error('useDnEntityFormContext must be used within a DnEntityFormProvider.');
    }
    return context as DnEntityFormBinding<T>;
}
