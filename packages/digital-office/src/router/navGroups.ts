export const DigitalOfficeNavGroup = {
    ContentManager: 'content-manager',
    Administration: 'administration',
} as const;

export type DigitalOfficeNavGroup = (typeof DigitalOfficeNavGroup)[keyof typeof DigitalOfficeNavGroup];

export interface DigitalOfficeNavGroupDef {
    id: string;
    label: string;
    order: number;
}

export const NAV_GROUP_DEFS: DigitalOfficeNavGroupDef[] = [
    { id: DigitalOfficeNavGroup.Administration, label: 'Administration', order: 10 },
    { id: DigitalOfficeNavGroup.ContentManager, label: 'Gestionnaire de contenu', order: 20 },
];
