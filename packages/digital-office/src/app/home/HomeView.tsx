import type { ApplicationVersionDto } from '@digital-net-org/digital-api-sdk';
import { Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDigitalNetApi } from '../../api';
import { DnView } from '../../ui';
import { useCustomNode } from '../custom-render';
import { useVersion } from '../version';

const APPLICATION_VERSION_KEY = 'dn_application_version';

export function HomeView() {
    const api = useDigitalNetApi();
    const clientVersion = useVersion();
    const { renderCustomNode } = useCustomNode();

    const { data: apiVersion } = useQuery<ApplicationVersionDto | undefined>({
        queryKey: [APPLICATION_VERSION_KEY],
        queryFn: async () => (await api.catalog.application.version()).value,
        staleTime: Infinity,
    });

    return (
        <DnView title="Accueil">
            {renderCustomNode({ entity: 'home', view: 'home:before' })}
            <Stack
                sx={theme => ({
                    flexDirection: 'row',
                    gap: 4,
                    mt: 2,
                    p: 1,
                    width: 'fit-content',
                    border: `solid 1px ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                })}
            >
                <VersionBlock
                    name="Digital.Net"
                    branch={apiVersion?.branch}
                    tag={apiVersion?.tag}
                    commit={apiVersion?.commit}
                />
                <VersionBlock
                    name="Digital-net.js"
                    branch={clientVersion?.branch}
                    tag={clientVersion?.tag}
                    commit={clientVersion?.commit}
                />
            </Stack>
            {renderCustomNode({ entity: 'home', view: 'home:after' })}
        </DnView>
    );
}

interface VersionBlockProps {
    name: string;
    branch?: string;
    tag?: string;
    commit?: string;
}

function VersionBlock({ name, branch, tag, commit }: VersionBlockProps) {
    return (
        <Stack>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {name}
            </Typography>
            <VersionRow label="branch" value={branch} />
            <VersionRow label="tag" value={tag} />
            <VersionRow label="commit" value={commit} />
        </Stack>
    );
}

function VersionRow({ label, value }: { label: string; value?: string }) {
    return (
        <Stack direction="row" sx={{ gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {label}:
            </Typography>
            <Typography variant="caption">{value ?? '—'}</Typography>
        </Stack>
    );
}
