import * as React from 'react';
import type { PageDto } from '@digital-net-org/digital-api-sdk';
import { Stack } from '@mui/material';
import { useParams } from 'react-router';
import { useDigitalNetApi } from '../../../api';
import { useCustomNode } from '../../../app';
import {
    DnEntityAuditBlock,
    DnEntityForm,
    type DnEntityFormProps,
    useDnEntityFormContext,
    useDnEntitySchema,
} from '../../../entity';
import { DnInputDebounced } from '../../../ui';
import { usePageTemplate } from './usePageTemplate';
import { usePageVariables } from './usePageVariables';

const PATH_HELPER = "Chemin d'accès vers la page depuis le site client.";
const PATH_AVAILABILITY_ERROR = 'Ce chemin est déjà utilisé.';
const PATH_DEBOUNCE_MS = 1500;

const baseFieldProps: DnEntityFormProps['fieldProps'] = {
    Path: {
        label: 'Chemin',
        helperText: PATH_HELPER,
    },
    Title: {
        label: 'Titre',
        helperText: "Titre affiché dans l'onglet du navigateur et dans les resultats des moteurs de recherche.",
    },
    Description: {
        label: 'Description',
        helperText:
            'Description courte affichée dans les résultats des moteurs de recherche. Limitée à 160 caractères idéalement.',
    },
    Redirect: {
        label: 'Redirection',
        helperText: "Si renseigné, redirige les visiteurs vers cette URL au lieu d'afficher la page.",
    },
    Published: {
        label: 'Publiée',
        helperText: 'Si activée, la page est accessible aux visiteurs du site. Sinon elle reste en brouillon.',
    },
    Indexed: {
        label: 'Indexée',
        helperText:
            "Autorise les moteurs de recherche à référencer cette page. Désactiver pour l'exclure du référencement.",
    },
};

export function PageTabGeneral() {
    const api = useDigitalNetApi();
    const { id } = useParams<{ id: string }>();
    const { schemas } = useDnEntitySchema('Page');
    const { values, apiData, setField, errors, disabled } = useDnEntityFormContext<PageDto>();
    const variables = usePageVariables();
    const { renderCustomNode } = useCustomNode();

    const pathSchema = React.useMemo(() => schemas.find(s => s.name === 'Path'), [schemas]);
    const pathPattern = pathSchema?.regexValidation ?? undefined;

    const currentPath = String(values.path ?? '');
    const apiPath = String(apiData?.path ?? '');
    const template = usePageTemplate(currentPath);

    const [pathAvailabilityError, setPathAvailabilityError] = React.useState(false);
    const handlePathChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setPathAvailabilityError(false);
        setField('/path', event.target.value);
    };
    const handlePathDebounced = async (next: string, signal: AbortSignal) => {
        const res = await api.catalog.page.checkAvailability(next, id, { signal });
        if (signal.aborted) return;
        setPathAvailabilityError(!res.hasError && !res.value);
    };

    const fieldProps: DnEntityFormProps['fieldProps'] = {
        ...baseFieldProps,
        Path: {
            ...baseFieldProps.Path,
            render:
                pathSchema && pathPattern ? (
                    <DnInputDebounced
                        type="text"
                        label="Chemin"
                        value={currentPath}
                        max={pathSchema.maxLength ?? undefined}
                        required={pathSchema.isRequired ?? undefined}
                        disabled={disabled}
                        pattern={pathPattern}
                        error={errors?.has('path') || pathAvailabilityError}
                        helperText={pathAvailabilityError ? PATH_AVAILABILITY_ERROR : PATH_HELPER}
                        debounceInMs={PATH_DEBOUNCE_MS}
                        skipWhen={value => value === apiPath}
                        onChange={handlePathChange}
                        onDebounced={handlePathDebounced}
                    />
                ) : null,
        },
        Title: {
            ...baseFieldProps.Title,
            placeholder: template?.title ?? undefined,
        },
        Description: {
            ...baseFieldProps.Description,
            placeholder: template?.description ?? undefined,
        },
        Redirect: {
            ...baseFieldProps.Redirect,
            placeholder: template?.redirect ?? undefined,
        },
    };

    return (
        <Stack spacing={2}>
            {renderCustomNode({ entity: 'Page', view: 'edit:tab:general:before' })}
            <DnEntityForm
                schemas={schemas}
                fieldProps={fieldProps}
                values={values as Record<string, unknown>}
                onFieldChange={setField}
                errors={errors}
                disabled={disabled}
                variables={variables}
            />
            {renderCustomNode({ entity: 'Page', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={values} />
        </Stack>
    );
}
