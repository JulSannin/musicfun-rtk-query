import { useGetMeQuery } from '@/entities/profile';

// главная страница
// пока заглушка, из содержимого только логин текущего пользователя
export const MainPage = () => {
    // isLoading, а не isFetching: он true только на первой загрузке,
    // и при фоновом перезапросе логин на экране не подменяется на "Loading..."
    const { data, isLoading, isError } = useGetMeQuery();

    return (
        <div>
            {/* заголовок вне веток: он не зависит от запроса и должен быть виден всегда */}
            <h1>Main page</h1>

            {isLoading && <div>Loading...</div>}
            {/* auth/me отвечает 401 и когда не залогинены, и когда токен протух; */}
            {/* без этой ветки и то и другое выглядело бы как пустая строка логина */}
            {isError && <div>Failed to load user</div>}
            {data && <div>login: {data.login}</div>}
        </div>
    );
};
