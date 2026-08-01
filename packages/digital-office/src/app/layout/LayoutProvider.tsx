import * as React from 'react';
import { LayoutContext } from './useDnLayout';

const DRAWER_STORAGE_KEY = 'DN_DRAWER_OPEN';

function readDrawerOpen(): boolean {
    try {
        return window.localStorage.getItem(DRAWER_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function writeDrawerOpen(value: boolean) {
    try {
        window.localStorage.setItem(DRAWER_STORAGE_KEY, String(value));
    } catch {}
}

export function LayoutProvider({ children, appLogo }: { appLogo: React.ReactNode; children: React.ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpenState] = React.useState<boolean>(readDrawerOpen);
    const [isUserSettingsOpen, setIsUserSettingsOpen] = React.useState<boolean>(false);

    const setIsDrawerOpen = React.useCallback((next: boolean) => {
        setIsDrawerOpenState(next);
        writeDrawerOpen(next);
    }, []);

    const toggleDrawer = React.useCallback(() => {
        setIsDrawerOpenState(prev => {
            const next = !prev;
            writeDrawerOpen(next);
            return next;
        });
    }, []);

    return (
        <LayoutContext.Provider
            value={{
                isDrawerOpen,
                toggleDrawer,
                setIsDrawerOpen,
                isUserSettingsOpen,
                setIsUserSettingsOpen,
                AppLogo: appLogo,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}
