# Блоки конструктора страницы — сводное оглавление

Единая карта для сборки. Один блок = одна сущность в `data.json` = один
раздел на сайте = один экран в админке = один пункт в динамическом рендере.
При интеграции команда сверяется по этому файлу: имя сущности, HTTP-эндпоинты,
контракт полей, где это лежит в исходном HTML.

**Легенда типа хранилища:**
- **список** — массив с CRUD (`POST` / `PUT /:id` / `DELETE /:id`), `id` назначает сервер.
- **объект** — одна редактируемая карточка, только `PUT`.
- **справочник** — как список, но с проверкой целостности при удалении.

**Общее для всех списков:** `id` — number (сервер), `active` — boolean
(дефолт `true`; `false` → скрыть на публичной странице). Ошибки — общий формат
`{ success: false, message: "..." }` с кодами 400 (валидация) / 404 (нет id) /
500 (сервер). Успех — `{ success: true, data: ... }` с кодом 200 (PUT/DELETE)
или 201 (POST).

---

## 1. Hero (шапка) — Блок 1

| Что | Значение |
|---|---|
| Тип | объект |
| Раздел HTML | `.section.hero#hero` (строки 170–178) |
| Секция админки | «Главная / Hero» |
| Ключ в data.json | `hero` |
| API | `PUT /api/hero` |

**Контракт:**
```js
hero: {
  title: string,                       // основной заголовок
  stats: [{ value: string, label: string }]  // счётчики «300+ сотрудников» и т.п.
}
```

---

## 2. Team (команда) — Блок 2

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.team` (строки 251–890) |
| Секция админки | «Сотрудники» |
| Ключ в data.json | `team` |
| API | `POST /api/team`, `PUT /api/team/:id`, `DELETE /api/team/:id` |

**Контракт:**
```js
team[]: {
  id, name, position, photo, vk, active
}
```

- `position` — берётся из справочника `positions[]` (Блок 11). Свободный ввод не запрещён, но админка Ивана предлагает `<select>`.
- `photo` — путь относительно корня сайта. При пустом — фронт подставит `upload/placeholder-avatar.svg`.
- `vk` — ссылка или `"#"` как placeholder.

---

## 3. Timeline (таймлайн продуктов) — Блок 3

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.platform` (строки 891–1687, без подблока `brands`) |
| Секция админки | «Таймлайн продуктов» |
| Ключ в data.json | `timeline` |
| API | `POST /api/timeline`, `PUT /api/timeline/:id`, `DELETE /api/timeline/:id` |

**Контракт:**
```js
timeline[]: {
  id,
  type,           // string, обязательное (например "product" | "event" | "milestone" — enum не жёсткий, свободный)
  year,           // number, целое 1990–2100
  mark,           // string, ОПЦИОНАЛЬНОЕ (метка/значок, например "Флагман"); дефолт ""
  title,          // string, обязательное
  subtitle,       // string, обязательное
  strategy,       // enum: "B2B" | "B2C" | "B2E" (бывший category — стратегический сегмент)
  text,           // string, обязательное (бывший description)
  active
}
```

- Сортировать в рендере по `year` ↑.
- Иконки продукта в контракте нет — фронт держит `Map<title, svg>` (или ретрофитим `iconKey` позже).
- **По просьбе Егора (Дни 9→10)** переименованы поля: `name`→`title`, `category`→`strategy`, `description`→`text`; добавлены `type` (обязательное) и `mark` (опциональное).

---

## 4. Brands (логотипы клиентов) — Блок 4

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | подблок `.platform__brands.brands` внутри `.platform` (1505–1687) |
| Секция админки | «Клиенты / бренды» |
| Ключ в data.json | `brands` |
| API | `POST /api/brands`, `PUT /api/brands/:id`, `DELETE /api/brands/:id` |

**Контракт:**
```js
brands[]: {
  id, src, name, active
}
```

- `src` — путь к SVG-логотипу (`local/templates/.../brands/*.svg` или свой).
- `name` — используется как `alt` у `<img>` (доступность) + подпись в админке.
- В HTML логотипы **не кликабельны** — `url` в контракте нет.
- Swiper-loop-дубли в HTML — визуальная механика, backend их не хранит.

---

## 5. Directions (направления работы) — Блок 5

| Что | Значение |
|---|---|
| Тип | список с вложенным массивом |
| Раздел HTML | `.section.directions#directions` (1690–2140) |
| Секция админки | «Направления» |
| Ключ в data.json | `directions` |
| API | `POST /api/directions`, `PUT /api/directions/:id`, `DELETE /api/directions/:id` |

**Контракт:**
```js
directions[]: {
  id,
  title,               // "Backend", "Frontend", "Тестирование", ...
  description,         // string
  technologies: [
    { name: string, icon: string }   // name — "React 19", icon — путь к PNG
  ],
  active
}
```

- `technologies` может быть пустым массивом (у «Безопасность» — так).
- Валидация вложенных элементов — с индексом в сообщении: `technologies[3].name обязательно ...`.
- HTML использует accordion. Egor рендерит с раскрытием по клику.

---

## 6. Vacancies (вакансии) — Блок 6

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.vacancies#vacancies` (строки 2165–...) |
| Секция админки | «Вакансии» |
| Ключ в data.json | `vacancies` |
| API | `POST /api/vacancies`, `PUT /api/vacancies/:id`, `DELETE /api/vacancies/:id` |

**Контракт:**
```js
vacancies[]: {
  id,
  title,
  format,       // "удаленно" / "Йошкар-Ола" / etc.
  url,          // ПОЛНАЯ ссылка с https://
  active
}
```

- `url` валидируется через `new URL()` — обязателен протокол. Без `https://` — 400.

---

## 7. Gallery (фотогалерея) — Блок 7

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.gallery#gallery` (строки 2272–2346) |
| Секция админки | «Галерея» |
| Ключ в data.json | `gallery` |
| API | `POST /api/gallery`, `PUT /api/gallery/:id`, `DELETE /api/gallery/:id` |

**Контракт:**
```js
gallery[]: {
  id,
  src,               // путь к файлу (.png / .mp4 / ...)
  type,              // enum: "image" | "video"
  caption,
  active
}
```

- **Единая карточка для картинки и видео** — фронт по `type` выбирает тег (`<img>` или `<video>`).
- Атрибуты `<video>`: `autoplay loop muted playsinline` + класс `card card--rounded video-src` (см. оригинальный HTML).
- Загрузки файлов в backend нет — путь набивают руками (файл заранее в `upload/`). Ретрофит на `multer` — отдельный будущий блок.

---

## 8. Work (офисы / фото рабочих мест) — Блок 8

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.work#work` (строки 2348–2414) |
| Секция админки | «Работа / офисы» |
| Ключ в data.json | `work` |
| API | `POST /api/work`, `PUT /api/work/:id`, `DELETE /api/work/:id` |

**Контракт:**
```js
work[]: {
  id, image, caption, active
}
```

- Каждая карточка = одно фото + подпись (могут быть офисы, а могут быть удалёнщики).
- Слоган секции «Работай как удобно / Наши офисы в Йошкар-Оле...» **не в контракте** — статичный текст, остаётся в HTML (или потом отдельный блок настроек).
- Поля `city` / `address` умышленно не заводим: HTML не даёт этих данных, а гадать backend не должен.

---

## 9. Benefits (бонусы / плюшки) — Блок 9

| Что | Значение |
|---|---|
| Тип | список |
| Раздел HTML | `.section.bonus#bonus` (строки 2416–...) |
| Секция админки | «Бонусы» |
| Ключ в data.json | `benefits` |
| API | `POST /api/benefits`, `PUT /api/benefits/:id`, `DELETE /api/benefits/:id` |

**Контракт:**
```js
benefits[]: {
  id, title, description, active
}
```

- Историческое имя сущности `benefits` (не `bonus`) — сложилось на Дне 3, не переименовываем. Класс секции — `.bonus`, id — `#bonus`; Егор в рендере просто использует `data.benefits` для рендера `.bonus`.

---

## 10. ContactForm (форма связи) — Блок 10

| Что | Значение |
|---|---|
| Тип | **объект** (одна запись, не список) |
| Раздел HTML | `.section.contact-form#contact-form` (2540–...) |
| Секция админки | «Форма связи» |
| Ключ в data.json | `contactForm` |
| API | `PUT /api/contact-form` |

**Контракт:**
```js
contactForm: {
  title,           // "Напиши нам"
  description,     // текст под заголовком
  submitLabel      // подпись на кнопке отправки, например "Отправить"
}
```

- Все три поля — обязательные непустые строки (валидация в `updateContactForm`).
- Список направлений в `<select name="direction">` берётся из блока 5 (`directions[].title`), отдельного массива в `contactForm` нет.
- **Сама отправка формы на backend не реализована.** HTML отправляет `POST /local/templates/template1/ajax/request.php` — это статика оригинального сайта, не наш API. Если понадобится хранить входящие заявки — отдельный будущий блок (`contactSubmissions[]`).

---

## 11. Positions (справочник должностей) — Блок 11

| Что | Значение |
|---|---|
| Тип | **справочник** (список с проверкой целостности) |
| Раздел HTML | нет (внутренний справочник) |
| Секция админки | «Должности» |
| Ключ в data.json | `positions` |
| API | `GET /api/positions`, `POST /api/positions`, `PUT /api/positions/:id`, `DELETE /api/positions/:id` |

**Контракт:**
```js
positions[]: { id, title }
```

- **Целостность:** `DELETE /api/positions/:id` **отказывает** (400), если должность используется у сотрудников — в сообщении список имён.
- Используется в форме сотрудника (`<select position>`) — блок 2.
- Нет поля `active` — справочник, а не контент.

---

## Сводная таблица (для быстрой сверки)

| # | Блок | Ключ | Тип | Секция HTML | API |
|---|---|---|---|---|---|
| 1 | Hero | `hero` | объект | `.hero` | `PUT /api/hero` |
| 2 | Команда | `team` | список | `.team` | CRUD `/api/team` |
| 3 | Таймлайн | `timeline` | список | `.platform` | CRUD `/api/timeline` |
| 4 | Клиенты | `brands` | список | `.platform__brands` | CRUD `/api/brands` |
| 5 | Направления | `directions` | список + вложенное | `.directions` | CRUD `/api/directions` |
| 6 | Вакансии | `vacancies` | список | `.vacancies` | CRUD `/api/vacancies` |
| 7 | Галерея | `gallery` | список | `.gallery` | CRUD `/api/gallery` |
| 8 | Офисы | `work` | список | `.work` | CRUD `/api/work` |
| 9 | Бонусы | `benefits` | список | `.bonus` | CRUD `/api/benefits` |
| 10 | Форма | `contactForm` | объект | `.contact-form` | `PUT /api/contact-form` |
| 11 | Должности | `positions` | справочник | — | CRUD `/api/positions` |

---

## Что делает `GET /api/data`

Один запрос возвращает **всё сразу** — весь объект `data.json` с проставленными
defensive-дефолтами для отсутствующих массивов/объекта `contactForm`.
Егорину публичную страницу это устраивает: один запрос при загрузке →
рендер всех разделов. Ване в админке — тоже удобно как единый снапшот для
начальной инициализации.

## Общие правила интеграции

1. **Рендер фильтрует `active === true`** для всех списков (кроме `positions`).
2. **`id` не редактируется на клиенте.** Только сервер назначает через `getNextId`.
3. **Пути к файлам** — относительные, от корня сайта (`upload/...` или `local/...`). Файлы физически лежат в `travelline_site/`, `express.static` их отдаёт.
4. **Валидация — только на бэкенде.** Клиентская UX-подсказка приветствуется, но не заменяет серверную.
5. **Кодировка** — UTF-8 везде: файлы, JSON, curl-тела (через `--data @file.json`, не inline на Windows).
