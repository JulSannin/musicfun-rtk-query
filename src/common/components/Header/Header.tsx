import { NavLink } from 'react-router'
import { Paths } from '../../routing/Paths'
import s from './Header.module.css'

// пункты меню
// вынесены в массив, чтобы разметку ссылки не дублировать на каждый пункт
// лежат вне компонента: массив не зависит от пропсов и не должен
// пересоздаваться на каждый рендер
const navItems = [
    { to: Paths.Main, label: 'Main' },
    { to: Paths.Playlists, label: 'Playlists' },
    { to: Paths.Tracks, label: 'Tracks' },
    { to: Paths.Profile, label: 'Profile' },
]

// шапка сайта, видна на всех страницах
// рендерится в App над Routing, поэтому переживает смену роута
export const Header = () => {
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
        </header>
    )
}
