import { useEffect, useRef } from 'react';
import { useLoginMutation } from '@/entities/profile';
import { paths } from '@/shared/config';

// открывает OAuth popup, ждёт code через postMessage от OAuthCallbackPage и логинит
export const LoginButton = () => {
    const [login] = useLoginMutation();

    // подписка текущей попытки входа; храним, чтобы снять её при повторном клике
    const attemptRef = useRef<AbortController | null>(null);

    // подписка не должна пережить компонент: popup могли бросить открытым
    useEffect(() => () => attemptRef.current?.abort(), []);

    const loginHandler = () => {
        const redirectUri =
            import.meta.env.VITE_DOMAIN_ADDRESS + paths.OAuthCallback;
        // VITE_BASE_URL уже заканчивается на "/" — без этого получался бы двойной
        // слэш ".../api/1.0//auth/oauth-redirect", на который бэкенд не матчится
        // и вместо OAuth-редиректа отдаёт 404 (пытается отдать статический index.html)
        const url = `${import.meta.env.VITE_BASE_URL}auth/oauth-redirect?callbackUrl=${encodeURIComponent(redirectUri)}`;

        // popup можно закрыть, не залогинившись, — тогда слушатель той попытки
        // так и висит на window. Без этого abort второй клик добавлял бы второй
        // слушатель, и пришедший code вызвал бы их все: несколько login с одним
        // и тем же кодом, где успешен только первый, а остальные дают 400
        // и показывают тост об ошибке поверх удачного входа
        attemptRef.current?.abort();
        const attempt = new AbortController();
        attemptRef.current = attempt;

        window.open(url, 'oauthPopup', 'width=500,height=600');

        window.addEventListener(
            'message',
            (event: MessageEvent) => {
                if (event.origin !== import.meta.env.VITE_DOMAIN_ADDRESS)
                    return;
                // ?? {} на случай postMessage(null) со своего же origin:
                // деструктуризация null бросает TypeError прямо в обработчике
                const { code } = (event.data ?? {}) as { code?: string };
                if (!code) return;
                // отписываемся сразу, иначе повторное сообщение из того же popup залогинит дважды
                attempt.abort();
                // rememberMe: true даёт refreshToken на 30 дней — без него
                // accessTokenTTL: '1d' в profileApi упрётся в 30-минутный refresh
                login({ code, redirectUri, rememberMe: true })
                    .unwrap()
                    .catch(() => {});
            },
            // signal снимает слушатель на abort — и при повторном клике, и при размонтировании
            { signal: attempt.signal }
        );
    };

    return (
        <button type="button" onClick={loginHandler}>
            login
        </button>
    );
};
