# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
npm run dev        # vite dev-сервер
npm run build      # tsc -b (typecheck) + vite build — единственная проверка типов, отдельного typecheck-скрипта нет
npm run lint       # eslint . (проверяются только src/**/*.{ts,tsx}), type-aware правила (tseslint recommendedTypeChecked)
npm run steiger    # проверка архитектурных правил FSD по ./src
npm run format     # prettier --write .
npm run gen:api    # перегенерация api-generated/ из файла ./api-json (openapi-ts)
```

Тестов в проекте нет: ни раннера, ни тестовых файлов. Не выдумывай команду для тестов — проверка изменений это `npm run build`, `npm run lint` и `npm run steiger`.

Комментарии в коде на русском и объясняющие («почему так», а не «что делает»). Новый код пиши в той же манере.

## Переменные окружения

`import.meta.env.VITE_BASE_URL`, `VITE_API_KEY`, `VITE_DOMAIN_ADDRESS` — типизированы в [src/vite-env.d.ts](src/vite-env.d.ts). В git лежит `.env` с базовым урлом и адресом фронта; `VITE_API_KEY` — в `.env.local` (не в git). При добавлении новой переменной обязательно добавь её в `ImportMetaEnv`, иначе опечатка пройдёт молча.

`VITE_BASE_URL` заканчивается слэшем — при ручной склейке урла (OAuth-редирект в [LoginButton.tsx](src/features/auth-login/ui/LoginButton.tsx)) второй слэш не добавлять, бэкенд на `//auth/...` не матчится и отдаёт 404 вместо редиректа.

## Архитектура

React 19 + Vite + RTK Query + react-router (declarative). Алиас `@` → `src/`.

### Feature-Sliced Design

Слои: `app` → `pages` → `widgets` → `features` → `entities` → `shared`. Импортировать можно только вниз по этому списку; правила проверяет steiger ([steiger.config.ts](steiger.config.ts)).

- Каждый слайс имеет `index.ts` — публичный API. Импорт всегда через него (`@/entities/playlist`), не в глубину папок.
- Исключение: в `shared` правило `public-api` отключено, но по факту действуют бочки на уровне сегментов — `@/shared/api`, `@/shared/lib`, `@/shared/ui`, `@/shared/config`.
- Сегменты внутри слайса: `api/` (эндпоинты + типы), `model/` (состояние, хуки, константы), `ui/` (компоненты).
- Пример разделения: [PlaylistCard](src/widgets/playlists-list/ui/PlaylistCard.tsx) — виджет, потому что склеивает презентацию из `entities` с действиями из `features`; сама энтити импортировать фичу не может.
- Но «энтити + фича» не обязано становиться виджетом. [TrackItem](src/entities/track/ui/TrackItem.tsx) и [TrackReactions](src/features/track-reaction/ui/TrackReactions.tsx) склеены прямо в [TracksPage](src/pages/tracks/ui/TracksPage.tsx): страница видит оба слоя, и этого достаточно. Виджет заводят, когда у склейки появляется своё состояние (режим редактирования в `PlaylistsList`) или второй потребитель (`/playlists` и `/profile`). У списка треков нет ни того, ни другого.
- Импорт между слайсами одного слоя запрещён (`fsd/forbidden-imports`), и это уже трижды повлияло на раскладку: карточка живёт внутри виджета [playlists-list](src/widgets/playlists-list/) (список её рендерит), а не отдельным слайсом `widgets/playlist-card`; общее для двух фич уезжает слоем ниже — поля формы в [PlaylistFormFields](src/entities/playlist/ui/PlaylistFormFields.tsx) вместе с лимитами из [playlistForm.ts](src/entities/playlist/model/playlistForm.ts) делят `playlist-create` и `playlist-update`; а [TagPicker](src/entities/tag/ui/TagPicker.tsx) не встроен внутрь `PlaylistFormFields`, хотя логически им там место, — `entities/playlist` не имеет права импортировать `entities/tag`. Композиция уезжает наверх, к тому, кто видит оба слайса: пикер ставится рядом с полями формы в [UpdatePlaylistForm](src/features/playlist-update/ui/UpdatePlaylistForm.tsx) и на [PlaylistsPage](src/pages/playlists/ui/PlaylistsPage.tsx). Это общее правило: если двум энтити нужно встретиться, они встречаются слоем выше, а не импортируют друг друга.
- В `index.ts` энтити наружу уходят RTK Query хуки (сам объект `playlistsApi`/`tracksApi` — нет), узкий набор типов и UI-компоненты. Тип отдаём только тот, который реально нужен снаружи.
- Правила `insignificant-slice` и `repetitive-naming` в steiger выключены: слайс из одного файла (например [features/playlist-delete](src/features/playlist-delete/)) — нормально, ругаться не будет.

### RTK Query: один API на приложение

[src/shared/api/baseApi.ts](src/shared/api/baseApi.ts) — единственный `createApi` с пустыми `endpoints`. Слайсы дописывают свои эндпоинты через `injectEndpoints`, а типы тегов — через `enhanceEndpoints({ addTagTypes: [...] })` рядом с эндпоинтами, которые их используют (см. [playlistsApi.ts](src/entities/playlist/api/playlistsApi.ts)). В store подключён только `baseApi.reducer` и `baseApi.middleware`, поэтому новый слайс с эндпоинтами не требует правок в [store.ts](src/app/model/store.ts).

Соглашения:

- Имена в `providesTags`/`invalidatesTags` должны совпадать буквально — рассинхрон TS не поймает, инвалидация просто молча не сработает.
- Списки помечаются `{ type: 'X', id: 'LIST' }`, отдельные сущности — своим id, чтобы правка одной не сбрасывала кеш остальных.
- Конверт JSON API (`{ data: { type, attributes } }`) собирается внутри `query` и проверяется через `satisfies` — `body` в RTK Query имеет тип `any`, без `satisfies` ошибку никто не поймает. Наружу мутация принимает только `attributes`.
- Файлы (`uploadPlaylistCover`) уходят как `FormData`, собранная внутри `query`. `Content-Type` руками не ставить — браузер сам допишет `boundary`, а заданный вручную заголовок его потеряет и бэкенд не разберёт тело. Имя поля берётся из свагера и у разных обложек разное: `file` у `POST /playlists/{id}/images/main`, но `cover` у `POST /playlists/tracks/{id}/cover` — копипаст мутации на треки молча не сработает.
- Массивы в query-параметрах уходят через свой `paramsSerializer` в [baseQuery.ts](src/shared/api/baseQuery.ts). Бэкенд ждёт повторяющийся ключ (`tagsIds=a&tagsIds=b`), а `new URLSearchParams` склеил бы массив запятой в `tagsIds=a%2Cb` — сервер примет это за один несуществующий id и молча вернёт пустой список; ни типы, ни линтер такого не видят, проверяется только вкладкой Network. Свой сериализатор **отключает** встроенный `stripUndefined`, поэтому пустые значения он выбрасывает сам, и в урл кладёт только примитивы: объект превратился бы в `[object Object]`. Тот же механизм понадобится для `artistsIds`.
- Ответ можно распаковать в `transformResponse`, если конверт наружу не нужен: `searchTags` в [tagsApi.ts](src/entities/tag/api/tagsApi.ts) отдаёт готовый `TagRef[]` вместо `{ data: [{ id, attributes: { name } }] }` — выбранные и найденные теги оказываются одного типа с тем, что лежит в атрибутах плейлиста. Это исключение из правила «`Get*Output` — ответ целиком»: оно про типы эндпоинта, а не про то, что обязано доехать до компонента.
- В `baseApi` включены `refetchOnFocus`/`refetchOnReconnect`. Их точечно выключают там, где фоновый перезапрос вреден: формы редактирования (затрёт набранное) и `infiniteQuery` (перезапросит все загруженные страницы разом).
- В формах редактирования используется `currentData`, а не `data`: `data` держит ответ по прошлому аргументу и покажет чужую сущность.
- Ошибки мутаций: `.unwrap().catch(() => toast.error(...))` — без `catch` будет необработанный промис. `ToastContainer` стоит один раз в [App.tsx](src/app/App.tsx).
- Оптимистичные обновления — через `onQueryStarted` (см. `updatePlaylist` в [playlistsApi.ts](src/entities/playlist/api/playlistsApi.ts)): `selectCachedArgsForQuery` находит все закешированные варианты списка (под разные страницы/поиск), `updateQueryData` патчит каждый, при неудаче патчи откатываются через `patch.undo()` в `catch` вокруг `queryFulfilled`.

### Реакции и патч кеша

Лайк/дизлайк есть и у плейлиста, и у трека, устроены одинаково — общая часть в [reaction.ts](src/shared/api/reaction.ts), эндпоинты в `setPlaylistReaction` / `setTrackReaction`. Схема целиком оптимистичная, и повторять её стоит вместе со всеми оговорками:

- Три ручки бэкенда (`POST .../likes`, `POST .../dislikes`, `DELETE .../reactions`) свёрнуты в одну мутацию: для UI это одно действие — переключение кнопки. Повторный клик по активной кнопке компонент превращает в `CurrentUserReaction.None`, и только на него уходит `DELETE`.
- `invalidatesTags` у реакций намеренно **нет**: сброс `Playlists/LIST` перезапрашивал бы всю страницу списка на каждый клик. Кеш поэтому чинится только руками, и если убрать патчи — счётчик замрёт до следующего похода на сервер.
- Один и тот же плейлист лежит сразу в нескольких записях кеша (каждый вариант списка + карточка `fetchPlaylist`), поэтому в `onQueryStarted` объявлен локальный `patchEverywhere(mutate)`, который прогоняет одну и ту же правку по всем ним. Патч по отсутствующей записи (карточка не открыта) просто ничего не делает — проверять наличие отдельно не нужно.
- Порядок: сначала `applyReaction` (догадка +1/−1, чтобы кнопка отзывалась мгновенно), после `await queryFulfilled` — `syncReaction` точными числами сервера (за время открытой страницы лайкнуть мог кто-то ещё), в `catch` — `patch.undo()`.
- `applyReaction` меняет объект **на месте**: он получает черновик immer из `updateQueryData`, а не копию. Возврат нового объекта тут молча ничего не изменит.
- `dislikesCount` в `ReactionCounters` опционален: в списке треков сервер его не отдаёт вообще. Обе функции проверяют именно поле (`!== undefined`), а не тип реакции. То же ограничение видно и в UI: у [TrackReactions](src/features/track-reaction/ui/TrackReactions.tsx) кнопка дизлайка без числа, только с `aria-pressed`, в отличие от [PlaylistReactions](src/features/playlist-reaction/ui/PlaylistReactions.tsx). Счётчик появится только на странице трека — в `GET /playlists/tracks/{trackId}` поле есть.
- Имена в ответе реакции не совпадают с атрибутами сущности (`likes`/`dislikes` против `likesCount`/`dislikesCount`) — перекладывает их `syncReaction`, больше нигде это делать не нужно.
- У треков кеш другой формы: `infiniteQuery` держит `{ pages, pageParams }`, поэтому трек ищется циклом по `state.pages` с выходом по первому совпадению.

### Авторизация

OAuth-логин с парой access/refresh токенов. Три файла в `shared/api`, каждый со своей ролью — не сваливать в один:

- [authTokens.ts](src/shared/api/authTokens.ts) — токены в `localStorage` под ключами из `AUTH_KEYS`, плюс type guard `isTokens` для ответа рефреша. Redux-слайса для токенов нет специально: `baseQuery` читает их синхронно, вне React.
- [baseQuery.ts](src/shared/api/baseQuery.ts) — «голый» `fetchBaseQuery`, вешает `API-KEY` и `Authorization`. На эндпоинте `login` заголовок с токеном намеренно не ставится: это обмен OAuth-кода на новую пару, и старый протухший `accessToken` из `localStorage` заставляет бэкенд отвечать на login 401.
- [baseQueryWithReauth.ts](src/shared/api/baseQueryWithReauth.ts) — обёртка, которую и получает `baseApi`.

Флоу логина: `LoginButton` открывает popup на `auth/oauth-redirect`, [OAuthCallbackPage](src/pages/oauth-callback/ui/OAuthCallbackPage.tsx) достаёт `code` из query и отдаёт его через `postMessage` в `window.opener`, `LoginButton` проверяет `event.origin`, сразу отписывается от `message` (иначе повторное сообщение логинит дважды) и зовёт `login`. Токены кладутся в `localStorage` в `onQueryStarted` мутации `login`, чистятся в `logout` — в `finally`, чтобы разлогин срабатывал даже при неудачном сетевом `auth/logout`.

Рефреш в `baseQueryWithReauth` — стандартная схема RTK Query с `Mutex` из `async-mutex`: параллельные запросы ждут `mutex.waitForUnlock()`, рефреш делает только первый поймавший 401, остальные после разблокировки повторяют свой запрос. Тонкости, которые легко сломать:

- Без `refreshToken` в `localStorage` на `auth/refresh` не ходим вообще — 401 просто уходит наверх.
- При неудачном рефреше вызывается только `clearTokens()`, **без** `dispatch(resetApiState())`: в `Header` всегда подписан `useGetMeQuery`, `resetApiState` немедленно перезапускает активные запросы, `getMe` снова ловит 401, снова пробует рефреш — бесконечный цикл.
- `handleErrors` зовётся здесь же, но только для `error.status !== 401` — 401 это внутренняя механика рефреша, тост по ней пользователю не нужен.
- `accessTokenTTL: '1d'` в мутации `login` связан с `rememberMe: true` в [LoginButton.tsx](src/features/auth-login/ui/LoginButton.tsx): TTL access-токена не может превышать время жизни refresh-токена, а оно зависит именно от `rememberMe` (`true` — 30 дней, `false` — 30 минут). Менять одно без другого нельзя, бэкенд ответит 400.

### Обработка ошибок

[handleErrors.ts](src/shared/api/handleErrors.ts) — единая точка показа ошибок сервера, вызывается из [baseQueryWithReauth.ts](src/shared/api/baseQueryWithReauth.ts) на каждый `result.error` кроме 401, точечно перехватывать ошибки в слайсах не нужно. Формат тела ответа зависит от статуса (JSON:API `{ errors: [{ detail }] }` на 400/403, `{ error }` на 404, `{ message }` на 429), поэтому разбор идёт через `switch (error.status)`; у 409 тела в спеке нет вообще — сначала пробуем тот же JSON:API, иначе свой текст, сырой ответ пользователю не показываем. 5xx показываются одинаковым текстом без содержимого ответа — там может быть стектрейс или внутренние пути. Сообщения про `refreshToken` в 400/403 глушатся — это ожидаемый протухший токен, а не ошибка пользователя. Длинные `detail` режет `trimToMaxLength`: на «название длиннее 100 символов» сервер возвращает вместе с текстом само значение поля, и тост разъезжается. Тосты — через [toast.ts](src/shared/lib/toast.ts) (`errorToast`/`successToast`).

Клиентские проверки до запроса `handleErrors` не видит — их тост показывается руками. Так сделана проверка картинки в [validateImageFile.ts](src/shared/lib/validateImageFile.ts): `validateImage(file, rules)` возвращает текст ошибки или `null`, вызывающий код сам зовёт `errorToast`. Ограничения лежат там же отдельными объектами (`PLAYLIST_COVER_RULES` — 1 МБ, квадрат, от 500px по высоте; `TRACK_COVER_RULES` — 100 КБ, обложка трека), потому что принадлежат API, а не конкретной кнопке; `ALLOWED_IMAGE_TYPES` заодно подставляется в `accept` у `<input type="file">`. Функция асинхронная: габариты известны только после `createImageBitmap`, поэтому файл декодируется — но только если правила про габариты спрашивают (у трека не спрашивают), и кадр обязательно закрывается через `bitmap.close()` в `finally`, он живёт вне сборщика мусора JS.

### Типы API

Типы запросов/ответов написаны руками в `<slice>/api/*Api.types.ts`. [api-generated/](api-generated/) — это выгрузка из свагера (`npm run gen:api` из файла [api-json](api-json)), она служит справочником для сверки и **не импортируется** в `src`. При правке типов API сверяйся с `api-generated/types.gen.ts`.

Именование внутри `*Api.types.ts` (держись его для новых эндпоинтов):

- `Fetch*Args` — query-параметры GET запроса;
- `Get*Output` — ответ целиком, вместе с `data`/`meta`/`included`;
- `*Resource` + `*Attributes` — части конверта JSON API;
- `Create*RequestPayload` / `Update*RequestPayload` — тело мутации с конвертом, наружу из слайса не экспортируется;
- `Create*Attributes` / `Update*Attributes` — то, что реально принимает мутация; вот эти экспортируются.

Внутренние `*Attributes` списка намеренно не экспортируются: компонентам передают отдельные поля, а не весь объект.

Исключение — [profileApi.types.ts](src/entities/profile/api/profileApi.types.ts): эндпоинты `auth/*` конверта JSON API не используют, тела плоские, поэтому `*Resource`/`*RequestPayload` там нет.

### Строгие настройки, ломающие сборку

В [tsconfig.app.json](tsconfig.app.json) включено то, что регулярно валит `npm run build` неочевидным образом:

- `verbatimModuleSyntax` — тип импортируется только через `import type`, обычный `import` для типа не соберётся.
- `erasableSyntaxOnly` — `enum`, `namespace` и параметры-свойства запрещены. Поэтому перечисления делаются объектом с `as const` и одноимённым типом (см. `CurrentUserReaction` в [src/shared/api/types.ts](src/shared/api/types.ts)).
- `noUnusedLocals` / `noUnusedParameters` — неиспользуемое имя это ошибка сборки. Отсюда `_result`, `_error` в `providesTags`/`invalidatesTags`: подчёркивание глушит правило.

Слова `strict` в конфиге нет, но TypeScript 6 включает его по умолчанию, и `strictNullChecks` **работает** (проверяется пробой: `const a: string = null` даёт TS2322). Практические следствия: `Map.get()` возвращает `V | undefined`, а `.filter(Boolean)` тип не сужает — нужен явный предикат `(x): x is T => Boolean(x)`, как в [useTracks.ts](src/pages/tracks/model/useTracks.ts). Ручные проверки на пустоту в коде (type guard'ы в [handleErrors.ts](src/shared/api/handleErrors.ts) и [authTokens.ts](src/shared/api/authTokens.ts), опциональная цепочка в компонентах) остаются, но теперь их подстраховывает компилятор.

ESLint: `@typescript-eslint/no-misused-promises` настроен с `checksVoidReturn: { attributes: false }` — async-обработчик прямо в JSX-атрибуте разрешён, а вот промис, переданный в проп с типом `() => void`, по-прежнему ошибка. Поэтому в [useInfiniteScroll.ts](src/shared/lib/hooks/useInfiniteScroll.ts) `fetchNextPage` объявлен как `() => unknown`.

Ещё два правила линтера валят сборку не там, где ждёшь:

- `react-hooks/set-state-in-effect` — сеттер `useState` внутри `useEffect` это ошибка, а не предупреждение. Чинится не отключением правила, а выводом значения на рендере: в [UpdatePlaylistForm](src/features/playlist-update/ui/UpdatePlaylistForm.tsx) выбранные теги хранятся как `TagRef[] | null`, где `null` значит «пользователь не трогал», и показываются как `editedTags ?? playlistResponse?.data.attributes.tags ?? []`. Эффект остался только под `reset` формы — он не сеттер. Это тот же приём, что и починка номера страницы в [usePlaylists.ts](src/pages/playlists/model/usePlaylists.ts).
- `@typescript-eslint/no-base-to-string` — `String(x)` над `unknown` или объектом. Всплывает в утилитах, принимающих чужие данные (см. `paramsSerializer`); лечится сужением до примитивов, а не приведением типа.

### Состояние страниц

Параметры списка и сам запрос живут в хуке `pages/<page>/model/use<Page>.ts`, компонент страницы отвечает только за разметку (см. [usePlaylists.ts](src/pages/playlists/model/usePlaylists.ts), [useTracks.ts](src/pages/tracks/model/useTracks.ts)). Redux-слайсов для UI-состояния нет — только локальный `useState` и кеш RTK Query.

Две разные модели пагинации живут рядом намеренно: плейлисты листаются номерами страниц (`query` + `Pagination`), треки — курсором через `build.infiniteQuery` (список пополняется, offset-пагинация давала бы дубли).

Списки фильтруются одинаково в [usePlaylists.ts](src/pages/playlists/model/usePlaylists.ts) и [useTracks.ts](src/pages/tracks/model/useTracks.ts), аргументы запроса собираются по четырём правилам:

- Пустое значение уходит как `undefined`, а не как `''`/`false`: RTK Query кеширует ответ под аргументом, и `search: ''` или `onlyLikedByMe: false` завели бы вторую запись кеша с тем же содержимым (плюс лишний параметр в урле). Поиск перед этим ещё и `trim()`, чтобы `" abc"` и `"abc"` не разъезжались.
- Поиск в запрос уходит только через `useDebounce`: в состоянии живут две строки — сырая для инпута и отложенная для запроса.
- Смена любого параметра сбрасывает `page` в 1 — но **только у плейлистов**: состав списка и количество страниц меняются, а номер остался бы от прошлой выдачи, поэтому у каждого сеттера свой хендлер. У треков хендлеров нет и сеттеры уходят наружу как есть: `infiniteQuery` кеширует страницы под набором аргументов, и смена фильтра сама переключает на другую запись с её собственной первой страницей (а возврат к прежнему набору мгновенный — его страницы никуда не делись).
- Фильтры, завязанные на пользователя, гасятся при разлогине, а не только прячутся: `canFilterByLikes && onlyLikedByMe` у плейлистов, `canFilterByUser && ...` у треков — иначе следующий запрос ушёл бы с чужим `userId` или в 401.

Про фильтры треков стоит знать отдельно:

- `sortBy` у треков это `publishedAt | likesCount`, у плейлистов — `addedAt | likesCount`. Union'ы выглядят взаимозаменяемыми, но `PlaylistSortBy` для треков не подходит; у каждого слайса свой тип.
- `includeDrafts` работает только в паре с `userId` текущего пользователя — по спеке черновики отдаются, если `userId === currentUserId`. Поэтому в UI это один переключатель «only mine (with drafts)», ставящий оба параметра: раздельные чекбоксы вводили бы в заблуждение, флаг сам по себе не делает ничего.
- Фильтр по тегам работает и у гостя: `tags/search` защищён только `API-KEY`. Bearer-токен требуют 27 операций из 41, но не поиск тегов — а вот `artists/search` требует, и когда появится фильтр по артистам, его придётся прятать, как `onlyLikedByMe`.

Три приёма из этих хуков стоит повторять:

- Зависимый запрос уходит со `skip`, пока не приехал аргумент, а `isLoading` наружу отдаётся склеенным ([useProfile.ts](src/pages/profile/model/useProfile.ts): `isMeLoading || isPlaylistsLoading`). Без `skip` первый запрос ушёл бы с `userId: undefined` и притащил чужие плейлисты; без склейки `isLoading` во время `skip` равен `false` и страница успела бы моргнуть пустым списком.
- `skip` нужен и там, где аргумент есть, но пустой: у `searchTags` параметр `search` обязателен по спеке, и с пустой строкой сервер ответит 400 — [TagPicker](src/entities/tag/ui/TagPicker.tsx) не отправляет запрос, пока в поле ничего не набрано. Эндпоинта «отдай все теги» в API нет вообще, только поиск по подстроке.
- Номер страницы, съехавший за `pagesCount` после удаления, чинится прямо на рендере (`setPage` в теле [usePlaylists.ts](src/pages/playlists/model/usePlaylists.ts)), а не в `useEffect`: React выбрасывает такой проход до коммита, лишнего запроса за несуществующую страницу не будет.

### Списки и владение

[PlaylistsList](src/widgets/playlists-list/ui/PlaylistsList.tsx) — один виджет на две страницы: `/playlists` (поиск + пагинация) и `/profile` (только свои). Различия задаются пропсами (`isFetching`, `emptyText`), а не копией разметки.

- Владелец считается один раз на весь список: `useGetMeQuery` вызывается в `PlaylistsList` и сравнивается с `playlist.attributes.user.id`, вниз в карточку уходит готовый `isOwner`. Новый запрос при этом не уходит — `Header` подписан на `getMe` всегда, читается тот же кеш; хук в каждой карточке дал бы столько же подписок, сколько карточек.
- Тем же ответом `getMe` считается `canReact` — он от плейлиста не зависит, поэтому вычисляется один раз рядом с `isOwner`, а не в цикле. Флаги разные: реагировать можно и на чужой плейлист, а редактировать — нет.
- Какой плейлист сейчас редактируется — состояние списка (`useState` в `PlaylistsList`), карточка получает только колбэк `onEdit`. Открытая форма схлопывается сама, если владение пропало (условие `isEditing && isOwner`).
- Действия спрятаны от чужого пользователя ради интерфейса, а не безопасности: на чужой плейлист бэкенд всё равно отвечает 403.

### Индикаторы загрузки

Два уровня: локальный (`isLoading`/`isFetching` конкретного хука прямо в компоненте, приглушает список или показывает `LoadingTrigger` при подгрузке страниц) и глобальный — [useGlobalLoading.ts](src/app/model/useGlobalLoading.ts) проходит по `state.baseApi.queries`/`mutations` и показывает `LinearProgress` в [App.tsx](src/app/App.tsx), если есть активный запрос. Эндпоинты со своим локальным индикатором перечислены в `excludedEndpoints` (по строковому имени, а не по `api.endpoints.x.name` — entities не отдают наружу сам объект api, см. выше) и глушат общий бар, кроме самого первого запроса, пока показать loading ещё нечем.

Отсюда следствие, о котором легко забыть: раз `fetchTracks` и `fetchPlaylists` исключены, свой индикатор им обязателен, иначе смена фильтров выглядит зависанием. И у бесконечного списка условие не `isFetching`, а `isFetching && !isFetchingNextPage` (в [useTracks.ts](src/pages/tracks/model/useTracks.ts) отдаётся наружу как `isReloading`): при подгрузке следующей страницы `isFetching` тоже `true`, но список тогда не заменяется, а дополняется, и гасить его неправильно.

### Пропсы компонентов

Вниз передаются только те поля, которые компонент рисует, а не вся сущность: `PlaylistInfo` берёт `title`, `authorName`, `tracksCount`, `duration` и готовые имена тегов (`tagNames`, а не сами `TagRef`), `PlaylistCover` — одни `images`. По той же причине `TrackItem` получает `artistNames` готовым массивом: разбор `included` из ответа JSON API живёт в [useTracks.ts](src/pages/tracks/model/useTracks.ts), где виден весь ответ целиком. Целый объект принимает только тот компонент, который стоит на границе списка ([PlaylistCard](src/widgets/playlists-list/ui/PlaylistCard.tsx), [TrackItem](src/entities/track/ui/TrackItem.tsx)). Компоненты из `shared/ui` про запросы не знают вообще — принимают значения и отдают колбэки.

По этой же границе разведены показ и действие: картинку рисует [PlaylistCover](src/entities/playlist/ui/PlaylistCover.tsx) из `entities` (её видят все, включая неавторизованных), а загрузку и удаление обложки делает [PlaylistCoverActions](src/features/playlist-cover/ui/PlaylistCoverActions.tsx) из `features` — он картинку не рисует и берёт `images` только чтобы понять, есть ли что удалять. Мутации остаются в фиче, энтити о них не знает.

### Что уже лежит в shared

Прежде чем писать своё — эти пять вещей уже есть, и у каждой есть неочевидная деталь:

- [Select](src/shared/ui/Select/Select.tsx) — дженерик по `T extends string | number`. Он ищет опцию по строковому представлению и отдаёт наверх **исходное** значение, а не строку из DOM: иначе union вроде `'addedAt' | 'likesCount'` пришлось бы возвращать через `as`, и опечатка прошла бы молча.
- [Pagination](src/shared/ui/Pagination/Pagination.tsx) — держит свой `PAGE_SIZE_OPTIONS` (8/16/32/40). В свагере у `pageSize` стоит `maximum: 20`, но ограничение устаревшее, бэкенд принимает и 40. Номера страниц прячутся при `pagesCount <= 1`, а селектор размера остаётся — иначе из `pageSize: 32` не выбраться.
- [useInfiniteScroll](src/shared/lib/hooks/useInfiniteScroll.ts) + [LoadingTrigger](src/shared/ui/LoadingTrigger/LoadingTrigger.tsx) — наблюдатель и маячок для курсорных списков. Обе проверки (`hasNextPage && !isFetching`) обязательны, наблюдатель срабатывает и во время загрузки. В маячке распорка в 20px не декоративная: у элемента нулевой высоты `IntersectionObserver` не сработает и подгрузка не запустится.
- [useDebounce](src/shared/lib/hooks/useDebounce.ts) — 500 мс по умолчанию.
- [formatDuration](src/shared/lib/formatDuration.ts) — сервер отдаёт длительность секундами и у трека, и у плейлиста целиком; час в строке появляется, только если он есть.

### Роутинг

Пути только из объекта `paths` в [src/shared/config/paths.ts](src/shared/config/paths.ts), строками в компонентах не писать. Все роуты объявлены в [Routing.tsx](src/app/routing/Routing.tsx).

## Стиль

Prettier: 4 пробела, одинарные кавычки, точки с запятой, `trailingComma: es5`. Стили компонентов — CSS-модули (`*.module.css`), импорт как `import s from './X.module.css'`.
