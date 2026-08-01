import * as React from 'react';
import { Divider, Stack, Tab, Tabs } from '@mui/material';
import { css, keyframes, styled } from '@mui/material/styles';
import { DnUrlParamBuilder, useDnUrlQueryState } from '../../../navigation';

export interface DnTab {
    key: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
}

export interface DnTabsProps {
    items: DnTab[];
    urlKey?: string;
    keepAlive?: boolean;
    renderActions?: React.ReactNode;
    renderBanner?: React.ReactNode;
    divider?: boolean;
}

export function DnTabs({ urlKey, ...props }: DnTabsProps) {
    return urlKey !== undefined ? <UrlTabs urlKey={urlKey} {...props} /> : <LocalTabs {...props} />;
}

type StateTabsProps = Omit<DnTabsProps, 'urlKey'>;

function LocalTabs({ items, ...rest }: StateTabsProps) {
    const [tab, setTab] = React.useState(items[0]?.key ?? '');
    const [, startTransition] = React.useTransition();
    const handleChange = React.useCallback((key: string) => startTransition(() => setTab(key)), []);

    return <TabsView items={items} activeKey={tab} onChange={handleChange} {...rest} />;
}

function UrlTabs({ items, urlKey, ...rest }: StateTabsProps & { urlKey: string }) {
    const [{ tab }, setState] = useDnUrlQueryState({
        tab: DnUrlParamBuilder.buildString(items[0]?.key ?? '', urlKey),
    });
    const activeTab = items.find(t => t.key === tab) ?? items[0];
    const [, startTransition] = React.useTransition();

    React.useEffect(
        () => (activeTab && activeTab.key !== tab ? setState({ tab: activeTab.key }) : void 0),
        [activeTab, tab, setState]
    );

    const handleChange = React.useCallback((key: string) => startTransition(() => setState({ tab: key })), [setState]);

    return <TabsView items={items} activeKey={activeTab?.key ?? ''} onChange={handleChange} {...rest} />;
}

interface TabsViewProps extends StateTabsProps {
    activeKey: string;
    onChange: (_key: string) => void;
}

function TabsView({
    items,
    activeKey,
    onChange,
    keepAlive = true,
    renderActions,
    renderBanner,
    divider,
}: TabsViewProps) {
    const [visited, setVisited] = React.useState<ReadonlySet<string>>(() => new Set(activeKey ? [activeKey] : []));
    if (keepAlive && activeKey && !visited.has(activeKey)) {
        setVisited(prev => new Set(prev).add(activeKey));
    }

    return (
        <React.Fragment>
            <TabsWrapper>
                <Tabs value={activeKey} onChange={(_, v) => onChange(v)}>
                    {items.map(t => (
                        <Tab key={t.key} value={t.key} label={t.label} disabled={t.disabled} />
                    ))}
                </Tabs>
                {renderActions ? <ActionsWrapper>{renderActions}</ActionsWrapper> : null}
            </TabsWrapper>
            {renderBanner}
            {items.map(t => {
                const isActive = t.key === activeKey;
                if (keepAlive ? !visited.has(t.key) : !isActive) return null;
                // `display: none` halts the fade-in animation; switching back to `flex` restarts it.
                return (
                    <ContentWrapper key={t.key} sx={{ display: isActive ? undefined : 'none' }}>
                        {divider ? <Divider /> : null}
                        {t.content}
                    </ContentWrapper>
                );
            })}
        </React.Fragment>
    );
}

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const ActionsWrapper = styled(Stack)(
    () => css`
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        padding-right: 0.5rem;
    `
);

const TabsWrapper = styled(Stack)(
    () => css`
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    `
);

const ContentWrapper = styled(Stack)(
    () => css`
        width: 100%;
        height: 100%;
        overflow-y: hidden;
        padding-top: 1.25rem;
        animation: ${fadeIn} 150ms ease;
    `
);
