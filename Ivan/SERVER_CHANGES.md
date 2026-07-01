# SERVER_CHANGES.md

## Важное уточнение

Начиная с 01.07.2026 `server.js`, `src/dataService.js` и `src/storage.js`
внутри `Practice/Ivan` — это файлы **участника 3 (Никиты)**, подтянутые
без единой правки с моей стороны. Более ранняя версия этого документа
описывала изменения, которые я вносил в эти файлы раньше (маршруты
должностей, поле `active` и т.д.) — те изменения больше не актуальны,
так как файлы полностью заменены на актуальную версию Никиты, которая
уже включает всё это и заметно больше (галерея, таймлайн, партнёры,
офисы, направления, контактная форма).

Если нужна история именно серверных изменений — она в репозитории/чате
Никиты, не здесь.

## Что реально моё (Ивана) внутри Practice/Ivan

- `admin/` — вся админ-панель (HTML, CSS, JS)
- `tests/dataService.test.js` — тесты, обращающиеся к функциям из
  `src/dataService.js` Никиты (сам файл не менял, только пишу тесты
  на экспортируемые из него функции)
- `data/data.json` — наполнение реальными данными с исходной страницы
  travelline.tech (сама структура задана контрактом Никиты)
- `travelline_site/dynamic-content.js` — доработки рендера под контракт
  Никиты для тех блоков, которые уже нужны были в моей части (галерея,
  таймлайн) — рендер остальных блоков (направления, офисы, партнёры,
  контактная форма) на публичной странице делает участник 1 (Егор)

## Актуальный список API-маршрутов (по факту, за авторством Никиты)

```
GET    /api/data
PUT    /api/hero
POST   /api/team,        PUT/DELETE /api/team/:id
POST   /api/vacancies,   PUT/DELETE /api/vacancies/:id
POST   /api/benefits,    PUT/DELETE /api/benefits/:id
POST   /api/gallery,     PUT/DELETE /api/gallery/:id
POST   /api/timeline,    PUT/DELETE /api/timeline/:id
GET    /api/positions
POST   /api/positions,   PUT/DELETE /api/positions/:id
POST   /api/brands,      PUT/DELETE /api/brands/:id
POST   /api/work,        PUT/DELETE /api/work/:id
POST   /api/directions,  PUT/DELETE /api/directions/:id
PUT    /api/contact-form
```
