import { NavLink } from 'react-router';
import { paths } from '@/shared/config';
import { useGetMeQuery } from '@/entities/profile';
import { LoginButton } from '@/features/auth-login';
import { LogoutButton } from '@/features/auth-logout';
import s from './Header.module.css';

// пункты меню
// вынесены в массив, чтобы разметку ссылки не дублировать на каждый пункт
// лежат вне компонента: массив не зависит от пропсов и не должен
// пересоздаваться на каждый рендер
// Profile сюда не входит: на страницу профиля переходят по клику на логин
const navItems = [
    { to: paths.Main, label: 'Main' },
    { to: paths.Playlists, label: 'Playlists' },
    { to: paths.Tracks, label: 'Tracks' },
];

// шапка сайта, видна на всех страницах
// рендерится в App над Routing, поэтому переживает смену роута
export const Header = () => {
    const { data } = useGetMeQuery();

    return (
        <header className={s.container}>
            <nav>
                <ul className={s.list}>
                    {/* key берем от адреса: он уникален и не меняется */}
                    {navItems.map((item) => (
                        <li key={item.to}>
                            {/* NavLink сам понимает, ведет ли он на текущую страницу */}
                            {/* isActive приходит от роутера, по нему подсвечиваем пункт */}
                            {/* className принимает функцию именно ради isActive */}
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `link ${isActive ? s.activeLink : ''}`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {data ? (
                <div className={s.loginContainer}>
                    <NavLink to={paths.Profile}>{data.login}</NavLink>
                    <LogoutButton />
                </div>
            ) : (
                <LoginButton />
            )}
        </header>
    );
};
