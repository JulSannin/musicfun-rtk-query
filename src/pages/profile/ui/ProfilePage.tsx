import { useGetMeQuery } from '@/entities/profile';

// страница профиля
// пока заглушка: из содержимого только логин текущего пользователя
// переходят сюда по клику на логин в шапке, поэтому неавторизованного
// состояния тут не ждем — кнопки перехода у него нет
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
