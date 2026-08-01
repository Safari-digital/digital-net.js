import React from 'react';
import { type DnEntityFormBinding, EntityFormContext } from './useDnEntityFormContext';

export interface DnEntityFormProviderProps<T> {
    binding: DnEntityFormBinding<T>;
    children: React.ReactNode;
}

export function DnEntityFormProvider<T>({ binding, children }: DnEntityFormProviderProps<T>) {
    return (
        <EntityFormContext.Provider value={binding as DnEntityFormBinding<unknown>}>
            {children}
        </EntityFormContext.Provider>
    );
}
