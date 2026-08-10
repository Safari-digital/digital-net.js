import { useNavigate } from 'react-router';

export interface DnNavigateOptions {
    replace?: boolean;
}

export type DnNavigate = (_to: string, _options?: DnNavigateOptions) => void;

/**
 * Navigates within the back-office shell.
 *
 * A consuming application mounts its screens inside `DigitalOfficeRouter`, so it needs a way to move
 * between them — but making it depend on the router this shell happens to use would leak an
 * implementation detail and force the dependency into every host app. This is the seam.
 */
export function useDnNavigate(): DnNavigate {
    const navigate = useNavigate();
    return (to, options) => navigate(to, { replace: options?.replace ?? false });
}
