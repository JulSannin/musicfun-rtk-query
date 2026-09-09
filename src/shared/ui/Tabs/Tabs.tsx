import s from './Tabs.module.css';

type Tab<T extends string> = {
    value: T;
    label: string;
};

type Props<T extends string> = {
    tabs: readonly Tab<T>[];
    value: T;
    onChange: (value: T) => void;
};

// переключатель секций страницы
// кнопки, а не ссылки: секция меняется параметром адреса, а не переходом
// на другой роут — какой именно параметр, компонент не знает вовсе
//
// дженерик по той же причине, что у Select: без него union вроде
// 'tracks' | 'playlists' пришлось бы возвращать наверх через as
export const Tabs = <T extends string>({ tabs, value, onChange }: Props<T>) => {
    return (
        <div className={s.tabs}>
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    type="button"
                    className={`${s.tab} ${tab.value === value ? s.tabActive : ''}`}
                    // активную вкладку не блокируем: disabled выкинул бы её
                    // из обхода по Tab, состояние передаёт aria-pressed —
                    // тот же приём, что у пагинации и кнопок реакций
                    aria-pressed={tab.value === value}
                    onClick={() => onChange(tab.value)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
