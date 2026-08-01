import * as React from 'react';
import { Typography } from '@mui/material';
import { DnDialog } from '../../ui';
import { type DnEntityIdentifier } from '../types';
import { resolveDeleteLabel, resolveNextLabel } from './identifier';

export interface EntityFailureDialogContentProps {
    open: boolean;
    content: { failures: { name: string | undefined }[]; total: number } | undefined;
    identifier: DnEntityIdentifier;
    onClose: () => void;
    onConfirm: () => void;
}

export function EntityDialogFailure({
    open,
    content = { failures: [], total: 0 },
    identifier,
    onClose,
    onConfirm,
}: EntityFailureDialogContentProps) {
    const successCount = content.total - content.failures.length;
    const pluralTotal = content.total > 1;
    const pluralFailures = content.failures.length > 1;
    const headerNoun = pluralTotal ? identifier.plural : identifier.singular;
    const headerNounCapitalized = headerNoun.charAt(0).toUpperCase() + headerNoun.slice(1);

    return (
        <DnDialog open={open} confirmLabel="Fermer" showCancelAction={false} onClose={onClose} onConfirm={onConfirm}>
            {open ? (
                <React.Fragment>
                    <Typography>
                        {headerNounCapitalized} {resolveDeleteLabel(identifier.gender, pluralTotal)} {successCount}/
                        {content.total}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                        Les {identifier.plural} {resolveNextLabel(identifier.gender, pluralFailures)} n&apos;ont pas pu
                        être {resolveDeleteLabel(identifier.gender, pluralFailures)} :
                    </Typography>
                    {content.failures.map((f, i) => (
                        <Typography key={i}>- {f.name ?? '(inconnu)'}</Typography>
                    ))}
                </React.Fragment>
            ) : null}
        </DnDialog>
    );
}
