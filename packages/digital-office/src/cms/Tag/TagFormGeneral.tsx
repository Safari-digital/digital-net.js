import * as React from 'react';
import type { TagDto } from '@digital-net-org/digital-api-sdk';
import { useCustomNode } from '../../app';
import {
    DnEntityAuditBlock,
    DnEntityForm,
    type DnEntityFormProps,
    useDnEntityFormContext,
    useDnEntitySchema,
} from '../../entity';

const fieldProps: DnEntityFormProps['fieldProps'] = {
    Name: {
        label: 'Nom',
        helperText: 'Identifiant lisible du tag.',
    },
    Color: {
        label: 'Couleur',
        helperText: 'Code couleur du tag, par exemple `#ff00aa`.',
    },
};

export function TagFormGeneral() {
    const { schemas } = useDnEntitySchema('tag');
    const { values, setField, errors, disabled } = useDnEntityFormContext<TagDto>();
    const { renderCustomNode } = useCustomNode();

    return (
        <React.Fragment>
            {renderCustomNode({ entity: 'tag', view: 'edit:tab:general:before' })}
            <DnEntityForm
                schemas={schemas}
                fieldProps={fieldProps}
                values={values}
                onFieldChange={setField}
                errors={errors}
                disabled={disabled}
            />
            {renderCustomNode({ entity: 'tag', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={values} />
        </React.Fragment>
    );
}
