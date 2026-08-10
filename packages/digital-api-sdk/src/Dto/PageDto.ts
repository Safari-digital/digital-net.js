import type { Entity } from '../Entity';

export interface PageDto extends Entity {
    path: string;
    published: boolean;
    indexed: boolean;
    title?: string;
    description?: string;
    jsonLd?: string;
    redirect?: string;
    createdAt: string;
    updatedAt?: string;
}
