import * as React from 'react';
import { Stack } from '@mui/material';
import type { FormDto } from '@digital-net-org/digital-api-sdk';
import { useCustomNode } from '../../../app';
import {
    DnEntityAuditBlock,
    DnEntityForm,
    type DnEntityFormProps,
    useDnEntityFormContext,
    useDnEntitySchema,
} from '../../../entity';

const fieldProps: DnEntityFormProps['fieldProps'] = {
    Name: {
        label: 'Nom',
        helperText: 'Nom interne du formulaire (visible en backoffice et dans les soumissions).',
    },
    Description: {
        label: 'Description',
        helperText: 'Texte facultatif décrivant le but du formulaire.',
    },
    Published: {
        label: 'Publié',
        helperText: 'Quand activé, le formulaire devient soumissible côté visiteur (route /submit).',
    },
    SubmitLabel: {
        label: 'Libellé du bouton',
        helperText: 'Texte affiché sur le bouton de soumission côté visiteur.',
    },
    Path: {
        label: 'Chemin associé',
        helperText:
            'Lien indicatif vers une page du site (ex. /contact). Sert au binding côté client, pas de relation forte avec une Page.',
    },
};

export function FormTabGeneral() {
    const { schemas } = useDnEntitySchema('Form');
    const { values, setField, errors, disabled } = useDnEntityFormContext<FormDto>();
    const { renderCustomNode } = useCustomNode();

    return (
        <Stack spacing={2}>
            {renderCustomNode({ entity: 'Form', view: 'edit:tab:general:before' })}
            <DnEntityForm
                schemas={schemas}
                fieldProps={fieldProps}
                values={values as Record<string, unknown>}
                onFieldChange={setField}
                errors={errors}
                disabled={disabled}
            />
            {renderCustomNode({ entity: 'Form', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={values} />
        </Stack>
    );
}
