import { useLoginMutation } from '@/entities/profile';
import { paths } from '@/shared/config';

// открывает OAuth popup, ждёт code через postMessage от OAuthCallbackPage и логинит
export const LoginButton = () => {
    const [login] = useLoginMutation();

    const loginHandler = () => {
        const redirectUri =
            import.meta.env.VITE_DOMAIN_ADDRESS + paths.OAuthCallback;
        // VITE_BASE_URL уже заканчивается на "/" — без этого получался бы двойной
        // слэш ".../api/1.0//auth/oauth-redirect", на который бэкенд не матчится
        // и вместо OAuth-редиректа отдаёт 404 (пытается отдать статический index.html)
        const url = `${import.meta.env.VITE_BASE_URL}auth/oauth-redirect?callbackUrl=${encodeURIComponent(redirectUri)}`;
        window.open(url, 'oauthPopup', 'width=500,height=600');

        const receiveMessage = (event: MessageEvent) => {
            if (event.origin !== import.meta.env.VITE_DOMAIN_ADDRESS) return;
            const { code } = event.data as { code?: string };
            if (!code) return;
            // отписываемся сразу, иначе повторное сообщение из того же popup залогинит дважды
            window.removeEventListener('message', receiveMessage);
            // rememberMe: true даёт refreshToken на 30 дней — без него
            // accessTokenTTL: '1d' в profileApi упрётся в 30-минутный refresh
            login({ code, redirectUri, rememberMe: true })
                .unwrap()
                .catch(() => {});
        };
        window.addEventListener('message', receiveMessage);
    };

    return (
        <button type="button" onClick={loginHandler}>
            login
        </button>
    );
};
