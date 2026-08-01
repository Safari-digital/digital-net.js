import * as React from 'react';
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export interface DraggableContext {
    rows: string[] | Array<{ id: string }>;
    onSort: (_active: string, _over: string) => void;
    children: React.ReactNode;
}

export function DraggableContext({ children, rows, onSort }: DraggableContext) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const ids = React.useMemo(() => {
        if (!rows || rows.length === 0) return [];
        return rows.map(row => {
            if (typeof row === 'object' && typeof row.id === 'string') {
                return row.id;
            } else if (typeof row === 'string') {
                return row;
            } else {
                throw new Error('DraggableContext rows property is malformed');
            }
        });
    }, [rows]);

    const handleDragEnd = React.useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            onSort(String(active.id), String(over.id));
        },
        [onSort]
    );

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
}
