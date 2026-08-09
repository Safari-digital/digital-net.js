import * as React from 'react';
import type { ArticleDto, ArticleRefDto } from '@digital-net-org/digital-api-sdk';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { Stack } from '@mui/material';
import { useParams } from 'react-router';
import { useCustomNode } from '../../../app';
import { DnEntityAuditBlock, DnEntityForm, useDnEntityFormContext, useDnEntitySchema } from '../../../entity';
import {
    DnButton,
    DnIconButton,
    DnInputAutocomplete,
    DnInputAutocompleteMultiple,
    DnInputAutocompleteMultipleFreesolo,
    DnInputDebounced,
} from '../../../ui';
import { useArticleForm } from './useArticleForm';
import { useArticleFormRelated } from './useArticleFormRelated';
import { type TagOption, useArticleFormTags } from './useArticleFormTags';

export function ArticleTabGeneral() {
    const { id } = useParams<{ id: string }>();
    const { schemas } = useDnEntitySchema('Article');
    const { values, errors, disabled } = useDnEntityFormContext<ArticleDto>();
    const { renderCustomNode } = useCustomNode();

    const { fieldProps, setFieldWithAutoSlug, slug, pages, titleSource } = useArticleForm(id);
    const tags = useArticleFormTags();
    const related = useArticleFormRelated(id);

    const resolvedFieldProps = {
        ...fieldProps,
        Slug: {
            ...(fieldProps.Slug ?? {}),
            render:
                slug.schema && slug.pattern ? (
                    <DnInputDebounced
                        type="text"
                        label="Segment URL"
                        value={slug.current}
                        max={slug.schema.maxLength ?? undefined}
                        required={slug.schema.isRequired ?? undefined}
                        disabled={disabled}
                        pattern={slug.pattern}
                        error={errors?.has('slug') || slug.availabilityError}
                        helperText={slug.availabilityError ? slug.availabilityErrorMessage : slug.helper}
                        debounceInMs={slug.debounceInMs}
                        skipWhen={value => value === slug.apiValue}
                        onChange={slug.handleChange}
                        onDebounced={slug.handleDebounced}
                        endAction={
                            <DnIconButton
                                tooltip="Générer le segment depuis le titre"
                                disabled={disabled || !titleSource.trim()}
                                onClick={slug.handleAuto}
                            >
                                <AutoAwesomeIcon />
                            </DnIconButton>
                        }
                    />
                ) : null,
        },
    };

    return (
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
            {renderCustomNode({ entity: 'Article', view: 'edit:tab:general:before' })}
            <DnEntityForm
                schemas={schemas}
                fieldProps={resolvedFieldProps}
                values={values as Record<string, unknown>}
                onFieldChange={setFieldWithAutoSlug}
                errors={errors}
                disabled={disabled}
            />

            <DnInputAutocomplete
                label="Page associée"
                helperText={"Page qui servira l'article."}
                value={pages.selected}
                options={pages.items}
                loading={pages.isLoading}
                getOptionLabel={p => p.path}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                onChange={page => setFieldWithAutoSlug('/pageId', page?.id ?? null)}
                disabled={disabled}
                renderListAction={
                    pages.hasMore ? (
                        <DnButton variant="outlined" size="small" loading={pages.isFetching} onClick={pages.loadMore}>
                            Charger plus ({pages.items.length}/{pages.total})
                        </DnButton>
                    ) : undefined
                }
            />

            <DnInputAutocompleteMultipleFreesolo<TagOption>
                label="Tags"
                helperText="Tapez un nom et validez pour créer un tag inexistant."
                placeholder="Ajouter un tag…"
                value={tags.value}
                options={tags.options}
                inputValue={tags.inputValue}
                onInputChange={tags.onInputChange}
                onChange={tags.onChange}
                getOptionLabel={tags.getOptionLabel}
                isOptionEqualToValue={tags.isOptionEqualToValue}
                createOptionFromText={tags.createOptionFromText}
                filterOptions={x => x}
                disabled={disabled}
                loading={tags.isFetching}
            />

            <DnInputAutocompleteMultiple<ArticleRefDto>
                label="Articles liés"
                helperText="Articles à proposer en complément (voir aussi)."
                placeholder="Rechercher un article…"
                value={related.value}
                options={related.options}
                inputValue={related.inputValue}
                onInputChange={related.onInputChange}
                onChange={related.onChange}
                getOptionLabel={related.getOptionLabel}
                isOptionEqualToValue={related.isOptionEqualToValue}
                filterOptions={x => x}
                disabled={disabled}
                loading={related.isFetching}
            />
            {renderCustomNode({ entity: 'Article', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={values} />
        </Stack>
    );
}
