import type { Entity } from '../Entity';
import type { ArticleMedia } from './ArticleMedia';
import type { ArticleRefDto } from './ArticleRefDto';
import type { TagDto } from './TagDto';

export interface ArticleDto extends Entity {
    title: string;
    description: string;
    content: string;
    slug: string;
    publishedAt?: string | null;
    pageId?: string | null;
    tags: TagDto[];
    media: ArticleMedia[];
    related: ArticleRefDto[];
}
