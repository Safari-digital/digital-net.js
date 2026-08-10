import { useEntityVariables } from '../../../entity';

export function usePageVariables() {
    const { variables } = useEntityVariables();
    return variables;
}
