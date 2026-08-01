import * as React from 'react';
import { Stack } from '@mui/material';
import type { PageDto } from '@digital-net-org/digital-api-sdk';
import { DnEntityTabHelper, useDnEntityFormContext } from '../../../entity';
import { DnExternalButton } from '../../../ui';
import { LazyDnEditorCode } from '../../../ui/components/DnEditor';
import { usePageVariables } from './usePageVariables';

const JSON_LD_DOC_URL = 'https://developers.google.com/search/docs/appearance/structured-data/search-gallery';
const JSON_LD_TEST_URL = 'https://search.google.com/test/rich-results';

export function PageTabJsonLd() {
    const { values, setField, disabled } = useDnEntityFormContext<PageDto>();
    const variables = usePageVariables();
    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTabHelper description="Définissez les résultats enrichis de votre page.">
                <DnExternalButton link={JSON_LD_DOC_URL}>Documentation</DnExternalButton>
                <DnExternalButton link={JSON_LD_TEST_URL}>Tester mon JSON</DnExternalButton>
            </DnEntityTabHelper>
            <Stack sx={{ flex: 1, minHeight: 0 }}>
                <LazyDnEditorCode
                    value={values.jsonLd ?? ''}
                    onChange={value => setField('/jsonLd', value)}
                    language="jsonld"
                    disabled={disabled}
                    templateVariables={variables}
                />
            </Stack>
        </Stack>
    );
}
