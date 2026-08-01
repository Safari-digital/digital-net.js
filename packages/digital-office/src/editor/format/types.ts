export interface CodeAnnotation {
    row: number; // 0-indexed
    column: number; // 0-indexed
    text: string;
    type: 'error' | 'warning' | 'info';
}
