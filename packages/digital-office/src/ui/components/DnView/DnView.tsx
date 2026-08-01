import * as React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { type DnTab, DnTabs } from '../DnTabs';

export type DnViewTab = DnTab;

export interface DnViewProps {
    title: string;
    description?: string;
    /** Shows a pending changes badge next to the title. */
    isDirty?: boolean;
    /** Rendered in the actions area of the tab bar. */
    renderActions?: React.ReactNode;
    /** Rendered full-width between the tab bar and the active panel. */
    renderBanner?: React.ReactNode;
    /** When provided, the view renders a tab bar instead of `children`. The active tab is synced to the URL internally. */
    tabs?: DnViewTab[];
    children?: React.ReactNode;
}

export function DnView({
    title,
    description,
    isDirty = false,
    renderActions,
    renderBanner,
    tabs,
    children,
}: DnViewProps) {
    return (
        <View>
            <Stack>
                <Stack sx={{ pb: 2 }}>
                    <Stack direction="row" sx={{ alignItems: 'baseline', gap: 2 }}>
                        <Typography variant="h2">{title}</Typography>
                        {isDirty ? (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'warning.main' }}>
                                (changements non sauvegardés)
                            </Typography>
                        ) : null}
                    </Stack>
                    {description ? (
                        <Typography variant="body2" sx={{ ml: 0.35, mt: 1 }}>
                            {description}
                        </Typography>
                    ) : null}
                </Stack>
                <Divider />
            </Stack>
            {tabs?.length ? (
                <DnTabs urlKey="tab" items={tabs} renderActions={renderActions} renderBanner={renderBanner} />
            ) : (
                children
            )}
        </View>
    );
}

const View = styled(Stack)(
    () => css`
        width: 100%;
        height: 100%;
        overflow-y: hidden;
    `
);
