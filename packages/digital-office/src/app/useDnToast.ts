import * as React from 'react';

export type DnToastVariant = 'info' | 'error';

export interface DnToastContextValue {
    showToast: (_message: string, _variant?: DnToastVariant) => void;
    hide: () => void;
}

export const ToastContext = React.createContext<DnToastContextValue | null>(null);

export function useDnToast(): DnToastContextValue {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useDnToast must be used within a ToastProvider.');
    }
    return context;
}
