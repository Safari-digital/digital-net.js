import { useDnEntityChildSchema } from '../../../entity';

export function useFieldSchema() {
    return useDnEntityChildSchema('Form', 'fields');
}
