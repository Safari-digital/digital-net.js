import type { Entity } from '../Entity';
import type { ConfigValueType } from './ConfigValueType';

export interface ConfigValueDto extends Entity {
    name: string;
    value?: string | null;
    type: ConfigValueType;
}
