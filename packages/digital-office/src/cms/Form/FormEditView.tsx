import * as React from 'react';
import { useParams } from 'react-router';
import {
    type FormDto,
    type FormFieldDto,
    type FormFieldPayload,
    JsonPatch,
    type JsonPatchOp,
    type Result,
    type SchemaProperty,
    defaultResult,
    schemaValidation,
} from '@digital-net-org/digital-api-sdk';
import { ObjectMapper } from '@digital-net-org/digital-core';
import { useDigitalNetApi } from '../../api';
import { DnEntityEditView, isCollectionValid, useDnEntitySchema } from '../../entity';
import { FormTabFields, FormTabGeneral, FormTabSubmissions } from './Tabs';

const FIELD_PAYLOAD_KEYS = [
    'name',
    'type',
    'label',
    'placeholder',
    'defaultValue',
    'required',
    'sortOrder',
    'validationJson',
    'optionsJson',
] as const satisfies readonly (keyof FormFieldPayload)[];

export function FormEditView() {
    const api = useDigitalNetApi();
    const { id } = useParams<{ id: string }>();
    const initialFieldsRef = React.useRef<FormFieldDto[]>([]);

    const { schemas: fieldSchemas, loading: fieldSchemaLoading } = useDnEntitySchema('formField');
    const validate = React.useCallback(
        (values: Partial<FormDto>, formSchemas: SchemaProperty[]) => {
            const missing = schemaValidation(values, formSchemas);
            if (values.fields?.length && (fieldSchemaLoading || !isCollectionValid(values.fields, fieldSchemas)))
                missing.add('fields');
            return missing;
        },
        [fieldSchemas, fieldSchemaLoading]
    );

    const handleGet = React.useCallback(
        async (id: string) => {
            const result = await api.catalog.crud.getById<FormDto>('form', id);
            if (result.value) initialFieldsRef.current = result.value.fields ?? [];
            return result;
        },
        [api.catalog]
    );

    const syncFields = React.useCallback(
        async (id: string, newFields: FormFieldDto[]): Promise<Result<any>> => {
            const oldFields = initialFieldsRef.current;
            const oldById = new Map(oldFields.map(f => [f.id, f]));
            const newIds = new Set(newFields.filter(f => f.id).map(f => f.id));

            for (const oldField of oldFields) {
                if (newIds.has(oldField.id)) continue;
                const deleted = await api.catalog.form.deleteField(id, oldField.id);
                if (deleted.hasError) return deleted;
            }

            for (const field of newFields) {
                if (!field.id) {
                    const created = await api.catalog.form.createField(
                        id,
                        ObjectMapper.pick(field, FIELD_PAYLOAD_KEYS)
                    );
                    if (created.hasError) return created;
                    continue;
                }
                const previous = oldById.get(field.id);
                if (!previous) continue;
                const fieldOps = JsonPatch.diff(previous, field, FIELD_PAYLOAD_KEYS);
                if (fieldOps.length === 0) continue;
                const patched = await api.catalog.form.updateField(id, field.id, fieldOps);
                if (patched.hasError) return patched;
            }

            initialFieldsRef.current = newFields;
            return defaultResult;
        },
        [api.catalog.form]
    );

    const handleUpdate = React.useCallback(
        async (id: string, ops: JsonPatchOp[]) => {
            const fieldsOp = ops.find(op => op.path === '/fields');
            const restOps = ops.filter(op => op.path !== '/fields');

            if (fieldsOp && 'value' in fieldsOp) {
                const newFields = (fieldsOp.value as FormFieldDto[] | null) ?? [];
                const syncResult = await syncFields(id, newFields);
                if (syncResult.hasError) return syncResult;
            }

            if (restOps.length === 0) return defaultResult;
            return api.catalog.form.update(id, restOps);
        },
        [api.catalog.form, syncFields]
    );

    const handleCreate = React.useCallback(
        async (values: Partial<FormDto>) => {
            const created = await api.catalog.form.create({
                name: String(values.name ?? ''),
                description: values.description ?? undefined,
                submitLabel: values.submitLabel ?? undefined,
                path: values.path ?? undefined,
            });
            if (created.hasError || !created.value) return created;
            const formId = created.value;

            const extraOps = JsonPatch.fromValues(values, {
                omit: ['id', 'createdAt', 'updatedAt', 'fields', 'name', 'description', 'submitLabel', 'path'],
            });
            if (extraOps.length > 0) {
                const patched = await api.catalog.form.update(formId, extraOps);
                if (patched.hasError) return created;
            }

            for (const field of values.fields ?? []) {
                await api.catalog.form.createField(formId, ObjectMapper.pick(field, FIELD_PAYLOAD_KEYS));
            }

            return created;
        },
        [api.catalog.form]
    );

    return (
        <DnEntityEditView<FormDto>
            entityName="form"
            identifier={{ singular: 'formulaire', plural: 'formulaires', gender: 'm' }}
            identifierAccessor="name"
            draftStoreName="forms"
            redirectPath="/content-manager/forms"
            tabs={[
                { key: 'general', label: 'Général', content: <FormTabGeneral /> },
                { key: 'fields', label: 'Champs', content: <FormTabFields /> },
                {
                    key: 'submissions',
                    label: 'Réponses soumises',
                    content: <FormTabSubmissions />,
                    disabled: !id,
                },
            ]}
            validate={validate}
            onGet={handleGet}
            onUpdate={handleUpdate}
            onCreate={handleCreate}
        />
    );
}
