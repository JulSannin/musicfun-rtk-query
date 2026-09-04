import { useGetMeQuery } from '@/entities/profile';

// страница профиля
// пока заглушка, авторизация еще не подключена
// сейчас токен берется из .env, логина в приложении нет
export const ProfilePage = () => {
    const { data, isLoading, isError } = useGetMeQuery();

    // весь контент страницы это логин, поэтому состояния показываем вместо него,
    // а не рядом с ним: пустой заголовок читается как сломанная страница
    if (isLoading) return <h1>Loading...</h1>;
    if (isError) return <h1>Failed to load profile</h1>;

    return (
        <div>
            <h1>{data?.login} page</h1>
        </div>
    );
};
