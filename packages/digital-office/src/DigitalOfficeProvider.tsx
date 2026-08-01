import * as React from 'react';
import type { DigitalApi } from '@digital-net-org/digital-api-sdk';
import { DigitalNetApiProvider, MutationStreamProvider } from './api';
import {
    CustomRenderProvider,
    DigitalNetUserProvider,
    type DnCustomViewDict,
    type DnVersion,
    LayoutProvider,
    ToastProvider,
    VersionProvider,
} from './app';
import { EntitySchemaProvider, EntityVariablesProvider, OgSchemaProvider } from './entity';
import { IdbProvider } from './storage';
import { Logo } from './ui/components/Logo';
import { ThemeProvider } from './ui/theme';

export interface DigitalOfficeProviderProps {
    api: DigitalApi;
    children: React.ReactNode;
    appLogo?: React.ReactNode;
    customRender?: DnCustomViewDict;
    version?: DnVersion;
}

export function DigitalOfficeProvider({ api, appLogo, customRender, version, children }: DigitalOfficeProviderProps) {
    return (
        <DigitalNetApiProvider api={api}>
            <ThemeProvider>
                <ToastProvider>
                    <DigitalNetUserProvider>
                        <MutationStreamProvider>
                            <IdbProvider>
                                <EntitySchemaProvider>
                                    <OgSchemaProvider>
                                        <EntityVariablesProvider>
                                            <LayoutProvider appLogo={appLogo ?? <Logo />}>
                                                <VersionProvider version={version}>
                                                    <CustomRenderProvider customRender={customRender}>
                                                        {children}
                                                    </CustomRenderProvider>
                                                </VersionProvider>
                                            </LayoutProvider>
                                        </EntityVariablesProvider>
                                    </OgSchemaProvider>
                                </EntitySchemaProvider>
                            </IdbProvider>
                        </MutationStreamProvider>
                    </DigitalNetUserProvider>
                </ToastProvider>
            </ThemeProvider>
        </DigitalNetApiProvider>
    );
}
