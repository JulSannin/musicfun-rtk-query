import { NavLink } from "react-router";
import { Path } from "../../routing/Paths";
import s from "./Header.module.css"

const navItems  = [
    {to: Path.Main, label: "Main"},
    {to: Path.Playlists, label: "Playlists"},
    {to: Path.Tracks, label: "Tracks"},
    {to: Path.Profile, label: "Profile"},
]

export const Header = () => {
    return (
        <header className={s.header}>
            <nav>
                <ul className={s.navList}>
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink 
                            to={item.to}
                            className={({isActive}) => `link ${isActive ? s.activeLink : ''}`}
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