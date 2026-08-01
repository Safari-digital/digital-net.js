import * as React from 'react';
import { DnLoadingView } from '../../ui/components/DnLoadingView';
import type { DnEditorCodeProps } from './DnEditorCode';

const DnEditorCodeImpl = React.lazy(() => import('./DnEditorCode').then(m => ({ default: m.DnEditorCode })));

export function LazyDnEditorCode(props: DnEditorCodeProps) {
    return (
        <React.Suspense fallback={<DnLoadingView />}>
            <DnEditorCodeImpl {...props} />
        </React.Suspense>
    );
}
