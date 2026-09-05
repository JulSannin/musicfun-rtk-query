# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm run dev        # vite dev-сервер
npm run build      # tsc -b (typecheck) + vite build — единственная проверка типов, отдельного typecheck-скрипта нет
npm run lint       # eslint по src/**/*.{ts,tsx}, type-aware правила (tseslint recommendedTypeChecked)
npm run steiger    # проверка архитектурных правил FSD по ./src
npm run format     # prettier --write .
npm run gen:api    # перегенерация api-generated/ из файла ./api-json (openapi-ts)
```

Тестов в проекте нет: ни раннера, ни тестовых файлов. Не выдумывай команду для тестов — проверка изменений это `npm run build`, `npm run lint` и `npm run steiger`.

Комментарии в коде на русском и объясняющие («почему так», а не «что делает»). Новый код пиши в той же манере.

## Переменные окружения

`import.meta.env.VITE_BASE_URL`, `VITE_API_KEY`, `VITE_ACCESS_TOKEN` — типизированы в [src/vite-env.d.ts](src/vite-env.d.ts). В git лежит только `.env` с базовым урлом; ключ и токен — в `.env.local` (не в git). При добавлении новой переменной обязательно добавь её в `ImportMetaEnv`, иначе опечатка пройдёт молча.

Логина в приложении нет: токен статический, `prepareHeaders` в [baseApi.ts](src/shared/api/baseApi.ts) вешает его на каждый запрос. `entities/profile` дёргает `auth/me` только чтобы показать, чей это токен.

## Архитектура

React 19 + Vite + RTK Query + react-router (declarative). Алиас `@` → `src/`.

### Feature-Sliced Design

Слои: `app` → `pages` → `widgets` → `features` → `entities` → `shared`. Импортировать можно только вниз по этому списку; правила проверяет steiger ([steiger.config.ts](steiger.config.ts)).

- Каждый слайс имеет `index.ts` — публичный API. Импорт всегда через него (`@/entities/playlist`), не в глубину папок.
- Исключение: в `shared` правило `public-api` отключено, но по факту действуют бочки на уровне сегментов — `@/shared/api`, `@/shared/lib`, `@/shared/ui`, `@/shared/config`.
- Сегменты внутри слайса: `api/` (эндпоинты + типы), `model/` (состояние, хуки, константы), `ui/` (компоненты).
- Пример разделения: [PlaylistCard](src/widgets/playlist-card/ui/PlaylistCard.tsx) — виджет, потому что склеивает презентацию из `entities` с действиями из `features`; сама энтити импортировать фичу не может.
- В `index.ts` энтити наружу уходят RTK Query хуки (сам объект `playlistsApi`/`tracksApi` — нет), узкий набор типов и UI-компоненты. Тип отдаём только тот, который реально нужен снаружи.
- Правила `insignificant-slice` и `repetitive-naming` в steiger выключены: слайс из одного файла (например [features/playlist-delete](src/features/playlist-delete/)) — нормально, ругаться не будет.

### RTK Query: один API на приложение

[src/shared/api/baseApi.ts](src/shared/api/baseApi.ts) — единственный `createApi` с пустыми `endpoints`. Слайсы дописывают свои эндпоинты через `injectEndpoints`, а типы тегов — через `enhanceEndpoints({ addTagTypes: [...] })` рядом с эндпоинтами, которые их используют (см. [playlistsApi.ts](src/entities/playlist/api/playlistsApi.ts)). В store подключён только `baseApi.reducer` и `baseApi.middleware`, поэтому новый слайс с эндпоинтами не требует правок в [store.ts](src/app/model/store.ts).

Соглашения:

- Имена в `providesTags`/`invalidatesTags` должны совпадать буквально — рассинхрон TS не поймает, инвалидация просто молча не сработает.
- Списки помечаются `{ type: 'X', id: 'LIST' }`, отдельные сущности — своим id, чтобы правка одной не сбрасывала кеш остальных.
- Конверт JSON API (`{ data: { type, attributes } }`) собирается внутри `query` и проверяется через `satisfies` — `body` в RTK Query имеет тип `any`, без `satisfies` ошибку никто не поймает. Наружу мутация принимает только `attributes`.
- В `baseApi` включены `refetchOnFocus`/`refetchOnReconnect`. Их точечно выключают там, где фоновый перезапрос вреден: формы редактирования (затрёт набранное) и `infiniteQuery` (перезапросит все загруженные страницы разом).
- В формах редактирования используется `currentData`, а не `data`: `data` держит ответ по прошлому аргументу и покажет чужую сущность.
- Ошибки мутаций: `.unwrap().catch(() => toast.error(...))` — без `catch` будет необработанный промис. `ToastContainer` стоит один раз в [App.tsx](src/app/App.tsx).
- Оптимистичные обновления — через `onQueryStarted` (см. `updatePlaylist` в [playlistsApi.ts](src/entities/playlist/api/playlistsApi.ts)): `selectCachedArgsForQuery` находит все закешированные варианты списка (под разные страницы/поиск), `updateQueryData` патчит каждый, при неудаче патчи откатываются через `patch.undo()` в `catch` вокруг `queryFulfilled`.

### Обработка ошибок

[handleErrors.ts](src/shared/api/handleErrors.ts) — единая точка показа ошибок сервера, вызывается из `baseQuery` в [baseApi.ts](src/shared/api/baseApi.ts) на каждый `result.error`, точечно перехватывать ошибки в слайсах не нужно. Формат тела ответа зависит от статуса (JSON:API `{ errors: [{ detail }] }` на 400/403, `{ error }` на 404, `{ message }` на 401/429), поэтому разбор идёт через `switch (error.status)`; 5xx показываются одинаковым текстом без содержимого ответа — там может быть стектрейс или внутренние пути. Тосты — через [toast.ts](src/shared/lib/toast.ts) (`errorToast`/`successToast`).

### Типы API

Типы запросов/ответов написаны руками в `<slice>/api/*Api.types.ts`. [api-generated/](api-generated/) — это выгрузка из свагера (`npm run gen:api` из файла [api-json](api-json)), она служит справочником для сверки и **не импортируется** в `src`. При правке типов API сверяйся с `api-generated/types.gen.ts`.

Именование внутри `*Api.types.ts` (держись его для новых эндпоинтов):

- `Fetch*Args` — query-параметры GET запроса;
- `Get*Output` — ответ целиком, вместе с `data`/`meta`/`included`;
- `*Resource` + `*Attributes` — части конверта JSON API;
- `Create*RequestPayload` / `Update*RequestPayload` — тело мутации с конвертом, наружу из слайса не экспортируется;
- `Create*Attributes` / `Update*Attributes` — то, что реально принимает мутация; вот эти экспортируются.

Внутренние `*Attributes` списка намеренно не экспортируются: компонентам передают отдельные поля, а не весь объект.

### Строгие настройки, ломающие сборку

В [tsconfig.app.json](tsconfig.app.json) включено то, что регулярно валит `npm run build` неочевидным образом:

- `verbatimModuleSyntax` — тип импортируется только через `import type`, обычный `import` для типа не соберётся.
- `erasableSyntaxOnly` — `enum`, `namespace` и параметры-свойства запрещены. Поэтому перечисления делаются объектом с `as const` и одноимённым типом (см. `CurrentUserReaction` в [src/shared/api/types.ts](src/shared/api/types.ts)).
- `noUnusedLocals` / `noUnusedParameters` — неиспользуемое имя это ошибка сборки. Отсюда `_result`, `_error` в `providesTags`/`invalidatesTags`: подчёркивание глушит правило.

ESLint: `@typescript-eslint/no-misused-promises` настроен с `checksVoidReturn: { attributes: false }` — async-обработчик прямо в JSX-атрибуте разрешён, а вот промис, переданный в проп с типом `() => void`, по-прежнему ошибка. Поэтому в [useInfiniteScroll.ts](src/shared/lib/hooks/useInfiniteScroll.ts) `fetchNextPage` объявлен как `() => unknown`.

### Состояние страниц

Параметры списка и сам запрос живут в хуке `pages/<page>/model/use<Page>.ts`, компонент страницы отвечает только за разметку (см. [usePlaylists.ts](src/pages/playlists/model/usePlaylists.ts), [useTracks.ts](src/pages/tracks/model/useTracks.ts)). Redux-слайсов для UI-состояния нет — только локальный `useState` и кеш RTK Query.

Две разные модели пагинации живут рядом намеренно: плейлисты листаются номерами страниц (`query` + `Pagination`), треки — курсором через `build.infiniteQuery` (список пополняется, offset-пагинация давала бы дубли).

### Индикаторы загрузки

Два уровня: локальный (`isLoading`/`isFetching` конкретного хука прямо в компоненте, приглушает список или показывает `LoadingTrigger` при подгрузке страниц) и глобальный — [useGlobalLoading.ts](src/app/model/useGlobalLoading.ts) проходит по `state.baseApi.queries`/`mutations` и показывает `LinearProgress` в [App.tsx](src/app/App.tsx), если есть активный запрос. Эндпоинты со своим локальным индикатором перечислены в `excludedEndpoints` (по строковому имени, а не по `api.endpoints.x.name` — entities не отдают наружу сам объект api, см. выше) и глушат общий бар, кроме самого первого запроса, пока показать loading ещё нечем.

### Пропсы компонентов

Вниз передаются только те поля, которые компонент рисует, а не вся сущность: `PlaylistInfo` берёт `title` и `authorName`, `PlaylistCover` — `playlistId` и `images`. Целый объект принимает только тот компонент, который стоит на границе списка ([PlaylistCard](src/widgets/playlist-card/ui/PlaylistCard.tsx), [TrackItem](src/entities/track/ui/TrackItem.tsx)). Компоненты из `shared/ui` про запросы не знают вообще — принимают значения и отдают колбэки.

### Роутинг

Пути только из объекта `paths` в [src/shared/config/paths.ts](src/shared/config/paths.ts), строками в компонентах не писать. Все роуты объявлены в [Routing.tsx](src/app/routing/Routing.tsx).

## Стиль

Prettier: 4 пробела, одинарные кавычки, точки с запятой, `trailingComma: es5`. Стили компонентов — CSS-модули (`*.module.css`), импорт как `import s from './X.module.css'`.
