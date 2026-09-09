import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';

// в каком параметре адреса лежит открытая секция
// имя одно на все страницы с вкладками: двух таких страниц в одном адресе
// не бывает, а совпадение имён делает ссылки предсказуемыми
const TAB_PARAM = 'tab';

// какая секция страницы открыта
// живёт в адресе, а не в useState: со страницы с вкладками уходят вглубь
// (на плейлист, в панель трека) и возвращаются «назад» — иначе возврат
// приводил бы не на ту вкладку, а ссылку на секцию было бы не скопировать
//
// хук в shared, потому что вкладки уже на двух страницах, а про API
// он не знает ничего — только про адрес
export const useUrlTab = <T extends string>(
    tabs: readonly T[],
    defaultTab: T,
    // «страница вот-вот уедет редиректом» — тогда адрес не трогаем вовсе:
    // дописывать вкладку в тот адрес, который сейчас сменится, незачем
    enabled = true
) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get(TAB_PARAM);

    // значение из адреса чужое, туда можно написать что угодно: сверяем
    // со списком, а не приводим типом
    const tab = tabs.find((item) => item === rawTab) ?? defaultTab;

    // useCallback, чтобы функцию можно было честно указать в зависимостях
    // эффекта ниже, а не глушить правило комментарием
    const setTab = useCallback(
        (next: T) => {
            setSearchParams(
                (prev) => {
                    // строим из prev, а не с нуля: рядом может лежать ?track=
                    // от открытой панели подробностей
                    const params = new URLSearchParams(prev);
                    params.set(TAB_PARAM, next);

                    return params;
                },
                // replace, а не push: «назад» должен уводить со страницы,
                // а не перелистывать секции по одной
                { replace: true }
            );
        },
        [setSearchParams]
    );

    // дефолтную вкладку дописываем в адрес, а не оставляем его пустым:
    // иначе ссылка есть только у одной секции, а на вторую её не скопировать.
    // Сюда же попадает мусор в параметре (?tab=zzz) — он схлопывается
    // в ту вкладку, которую мы и так показываем
    useEffect(() => {
        if (!enabled) return;
        if (rawTab === tab) return;

        setTab(tab);
    }, [rawTab, tab, enabled, setTab]);

    return { tab, setTab };
};
