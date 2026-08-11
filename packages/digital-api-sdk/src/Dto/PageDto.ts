import type { Entity } from '../Entity';

export interface PageDto extends Entity {
    path: string;
    published: boolean;
    publishedAt?: string;
    indexed: boolean;
    title?: string;
    description?: string;
    jsonLd?: string;
    redirect?: string;
    createdAt: string;
    updatedAt?: string;
}
