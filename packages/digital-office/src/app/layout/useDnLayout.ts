import * as React from 'react';

export interface DnLayoutContextValue {
    isDrawerOpen: boolean;
    toggleDrawer: () => void;
    setIsDrawerOpen: (_isOpen: boolean) => void;
    isUserSettingsOpen: boolean;
    setIsUserSettingsOpen: (_isOpen: boolean) => void;
    AppLogo: React.ReactNode;
}
export const LayoutContext = React.createContext<DnLayoutContextValue | null>(null);

export function useDnLayout(): DnLayoutContextValue {
    const context = React.useContext(LayoutContext);
    if (!context) {
        throw new Error('useDnLayout must be used within a LayoutProvider.');
    }
    return context;
}
