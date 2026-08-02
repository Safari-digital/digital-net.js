import * as React from 'react';
import { type MediaDto } from '@digital-net-org/digital-api-sdk';
import { DnEntityEditView } from '../../entity';
import { MediaTabGeneral, MediaTabVariants } from './Tabs';

export function MediaEditView() {
    return (
        <DnEntityEditView<MediaDto>
            entityName="Media"
            identifier={{ singular: 'média', plural: 'médias', gender: 'm' }}
            identifierAccessor="name"
            redirectPath="/content-manager/media"
            tabs={[
                {
                    key: 'general',
                    label: 'Général',
                    content: <MediaTabGeneral />,
                },
                {
                    key: 'variants',
                    label: 'Variants',
                    content: <MediaTabVariants />,
                },
            ]}
        />
    );
}
