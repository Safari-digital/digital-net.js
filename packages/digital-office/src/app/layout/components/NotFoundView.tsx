import * as React from 'react';
import { LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router';
import { ErrorView } from './ErrorView';

const REDIRECT_DELAY_MS = 5000;
const TICK_MS = 100;

export function NotFoundView() {
    const navigate = useNavigate();
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const pct = Math.min(100, ((Date.now() - startTime) / REDIRECT_DELAY_MS) * 100);
            setProgress(pct);
            if (pct >= 100) clearInterval(interval);
        }, TICK_MS);

        const redirect = setTimeout(() => navigate('/'), REDIRECT_DELAY_MS);

        return () => {
            clearInterval(interval);
            clearTimeout(redirect);
        };
    }, [navigate]);

    return (
        <ErrorView
            statusCode={404}
            title="Erreur 404"
            description="Cette page n'existe pas, vous allez etre redirigé à l'accueil."
        >
            <LinearProgress variant="determinate" value={progress} sx={{ width: '60%', maxWidth: 480 }} />
        </ErrorView>
    );
}
