# Practice — сайт Travelline + админка

Node.js/Express-приложение: статичный сайт-визитка + админка для редактирования
контента (`data.json`). Все контентные блоки и их API описаны в [BLOCKS.md](BLOCKS.md).

## Требования

- Node.js 18+ (проверено на 18/20)
- npm

## Установка и запуск

```bash
git clone https://github.com/nikitosiron/Practice.git
cd Practice
npm install
```

`npm install` поставит все зависимости из `package.json` одной командой:
`express`, `express-session`, `bcrypt`, `dotenv`, `multer`. Ставить их
по одной через `npm i express` / `npm i bcrypt` не нужно — и именно из-за
пропущенного `npm install` команда генерации хеша пароля ниже падает с
`Cannot find module 'bcrypt'`.

> **Windows.** `bcrypt` — нативный модуль, при установке компилируется.
> Обычно свежий Node.js 18/20 подтягивает готовый бинарник и всё
> проходит без плясок. Если `npm install` ругается на `node-gyp` или
> отсутствие C++ toolchain — поставь
> [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)
> или Visual Studio Build Tools (C++ workload) и повтори установку.

Создать `.env` в корне проекта (шаблон — [.env.example](.env.example)):

```env
ADMIN_LOGIN=admin
ADMIN_PASSWORD_HASH=<bcrypt-хеш пароля>
SESSION_SECRET=<длинная случайная строка>
# PORT=3000  # опционально
```

**Без этих трёх переменных сервер откажется стартовать** (`process.exit(1)`
в [server.js:28](server.js#L28)).

Сгенерировать хеш пароля и секрет сессии:

```bash
# ADMIN_PASSWORD_HASH
node -e "console.log(require('bcrypt').hashSync('ВАШ_ПАРОЛЬ', 10))"

# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Запуск:

```bash
npm start
```

- Публичный сайт: <http://localhost:3000/>
- Админка: <http://localhost:3000/admin/> (редиректит на `/admin/login/`, логин по значениям из `.env`)

## Тесты

```bash
npm test
```

Используется встроенный `node --test`; файлы лежат в `test/`.

## Структура

- `server.js` — Express, роуты `/api/*`, сессии, статика.
- `src/dataService.js` — CRUD-операции над `data.json` (валидация + запись).
- `src/storage.js` — чтение/запись `data.json`.
- `data.json` — единственный источник контента (все 11 блоков).
- `travelline_site/` — публичная статика (HTML/CSS/JS/uploads), отдаётся как `/`.
  - `dynamic-content.js` — рендер контента на публичной странице.
- `admin/` — статика админки (SPA-подобная), отдаётся под `/admin/*` после авторизации.
- `BLOCKS.md` — контракты всех контентных блоков и эндпоинтов.

## Загрузка файлов

`multer` сохраняет пользовательские файлы в
`travelline_site/upload/user-uploads/` (endpoint `POST /api/upload`,
только для авторизованного админа). Директория должна существовать —
Git её сохраняет через `.gitkeep`.
