import * as React from 'react';
import type { DigitalApi } from '@digital-net-org/digital-api-sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { DigitalNetApiContext } from './useDigitalNetApi';

export function DigitalNetApiProvider({ api, children }: { api: DigitalApi; children: React.ReactNode }) {
    return (
        <DigitalNetApiContext.Provider value={api}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </DigitalNetApiContext.Provider>
    );
}
