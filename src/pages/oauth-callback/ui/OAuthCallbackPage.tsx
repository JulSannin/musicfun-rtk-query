import { useEffect } from 'react';

// страница-приёмник OAuth-редиректа: достаёт code из query-строки,
// отдаёт его в открывшее popup окно и закрывается сама
export const OAuthCallbackPage = () => {
    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get('code');
        // window.opener типизирован как any, поэтому явно приводим к Window
        const opener = window.opener as Window | null;
        // targetOrigin конкретный, а не '*': с '*' OAuth-код ушёл бы любому окну,
        // которое нас открыло, кем бы оно ни было
        if (code && opener)
            opener.postMessage({ code }, import.meta.env.VITE_DOMAIN_ADDRESS);
        window.close();
    }, []);

    return <p>Logging you in...</p>;
};
