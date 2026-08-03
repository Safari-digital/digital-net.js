import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteOutlined as DeleteIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { Box, Stack } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { DnIconButton } from '../DnIconButton';

export interface DnDraggableRowProps {
    id: string;
    disabled?: boolean;
    children?: React.ReactNode;
    onDelete?: (_id: string) => void;
}

export function DnDraggableRow({ id, disabled = false, onDelete = undefined, children }: DnDraggableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    const handleDelete = (): void => onDelete?.(id);

    return (
        <Row ref={setNodeRef} style={style} data-dragging={isDragging || undefined}>
            <ActionWrapper>
                <DragHandle {...attributes} {...listeners} disabled={disabled}>
                    <DragIndicatorIcon fontSize="small" />
                </DragHandle>
            </ActionWrapper>
            <Content>{children}</Content>
            {onDelete ? (
                <ActionWrapper>
                    <DnIconButton tooltip="Supprimer" disabled={disabled} onClick={handleDelete}>
                        <DeleteIcon />
                    </DnIconButton>
                </ActionWrapper>
            ) : null}
        </Row>
    );
}

const Row = styled(Stack)(
    ({ theme }) => css`
        border-radius: ${theme.shape.borderRadius};
        background: ${theme.palette.background.paper};
        padding: 0.75rem;
        flex-direction: row;
        align-items: center;
        &[data-dragging] {
            box-shadow: ${theme.shadows[4]};
        }
    `
);

const Content = styled(Stack)(
    () => css`
        width: 100%;
        padding: 0.15rem 0.15rem 0;
        flex-direction: column;
    `
);

const ActionWrapper = styled(Box)(
    () => css`
        height: 100%;
        flex-direction: column;
        justify-content: flex-start;
    `
);

const DragHandle = styled('button', { shouldForwardProp: prop => prop !== 'disabled' })<{ disabled: boolean }>(
    ({ theme, disabled }) => css`
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        padding: 0.5rem 0.5rem 0 0;
        color: ${disabled ? theme.palette.text.disabled : theme.palette.text.secondary};
        cursor: ${disabled ? 'default' : 'grab'};

        &:active {
            cursor: ${disabled ? 'default' : 'grabbing'};
        }

        &:focus-visible {
            outline: 2px solid ${theme.palette.primary.main};
            outline-offset: 2px;
        }
    `
);
