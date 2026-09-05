import { useLogoutMutation } from '@/entities/profile';

export const LogoutButton = () => {
    const [logout] = useLogoutMutation();

    const logoutHandler = () => {
        logout()
            .unwrap()
            .catch(() => {});
    };

    return (
        <button type="button" onClick={logoutHandler}>
            logout
        </button>
    );
};
