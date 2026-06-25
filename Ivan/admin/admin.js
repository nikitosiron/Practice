// Показывает сообщение в строке статуса под заголовком админки.
// message — текст, type — 'success' или 'error' (влияет на цвет через CSS).
function showStatus(message, type) {
    // Если type не передали — считаем, что это успех (зелёный).
    if (type === undefined) {
        type = 'success';
    }

    // Находим <p id="status"> в разметке.
    var status = document.querySelector('#status');

    // Защита: если элемента почему-то нет — молча выходим.
    if (!status) {
        return;
    }

    // Записываем текст сообщения.
    status.textContent = message;

    // Назначаем классы: базовый "status" + модификатор по типу.
    // В CSS .status.success зелёный, .status.error красный.
    status.className = 'status ' + type;
}

// Загружает все данные сайта с сервера и раскладывает их по секциям админки.
// fetch возвращает промис → работаем с ним через .then() / .catch() (без async/await).
function loadData() {
    fetch('/api/data')
        .then(function (response) {
            // response.ok = true, если статус 200–299.
            // Если сервер ответил ошибкой — кидаем исключение, оно уйдёт в .catch.
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные');
            }
            // response.json() — тоже промис. Возвращаем его, чтобы следующий
            // .then получил уже распарсенный JSON-объект.
            return response.json();
        })
        .then(function (data) {
            // data — это { hero, team, vacancies, benefits }.
            // Раскладываем каждый блок в свою рендер-функцию.
            renderHeroForm(data.hero);
            renderTeam(data.team);
            renderVacancies(data.vacancies);
            renderBenefits(data.benefits);
        })
        .catch(function (error) {
            // Ловим ЛЮБУЮ ошибку из цепочки: сеть, парсинг, наш throw выше.
            showStatus('Ошибка загрузки: ' + error.message, 'error');
        });
}

// Заполняет форму Hero данными с сервера.
// hero — объект { title: '...', stats: [{value, label}, ...] }
function renderHeroForm(hero) {
    // 1) Заголовок: ищем input и подставляем значение.
    var titleInput = document.querySelector('#hero-title');
    titleInput.value = hero.title;

    // 2) Список статистики. Сначала ОЧИЩАЕМ контейнер,
    //    иначе при повторном вызове строки задублируются.
    var statsList = document.querySelector('#hero-stats');
    statsList.innerHTML = '';

    // 3) Для каждого элемента массива stats строим строку и добавляем в список.
    for (var i = 0; i < hero.stats.length; i++) {
        var stat = hero.stats[i];
        var row = buildStatRow(stat);
        statsList.appendChild(row);
    }
}

// Создаёт DOM-элемент одной строки статистики.
// Возвращает <div class="stats-row advantages__item"> с двумя input-ами и кнопкой Удалить.
function buildStatRow(stat) {
    // Внешний контейнер строки.
    var row = document.createElement('div');
    row.className = 'stats-row advantages__item';

    // Поле "значение" (300+, 12 000+).
    var value = document.createElement('input');
    value.type = 'text';
    value.className = 'field-input stats-value advantages__item-title';
    value.value = stat.value;
    row.appendChild(value);

    // Поле "подпись" (сотрудников, клиентов).
    var label = document.createElement('input');
    label.type = 'text';
    label.className = 'field-input stats-label';
    label.value = stat.label;
    row.appendChild(label);

    // Кнопка "Удалить" — убирает строку из DOM.
    // На сервер ничего не шлём: Hero сохраняется целиком через PUT /api/hero,
    // и saveHero() возьмёт текущее состояние формы — уже без удалённой строки.
    var del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Удалить';
    del.addEventListener('click', function () {
        row.remove();
    });
    row.appendChild(del);

    return row;
}

// Собирает текущее состояние формы Hero обратно в объект.
// Возвращает { title, stats: [{value, label}, ...] } — то, что отправим на сервер.
function collectHeroData() {
    // Берём текущее значение заголовка.
    var title = document.querySelector('#hero-title').value;

    // Проходим по всем строкам статистики и собираем их значения.
    var stats = [];
    var rows = document.querySelectorAll('#hero-stats .stats-row');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var value = row.querySelector('.stats-value').value;
        var label = row.querySelector('.stats-label').value;
        stats.push({ value: value, label: label });
    }

    return { title: title, stats: stats };
}

// Сохраняет Hero на сервере через PUT /api/hero.
function saveHero() {
    // 1) Собираем данные из формы.
    var data = collectHeroData();

    // 2) Простая валидация: заголовок и поля статистики не должны быть пустыми.
    if (data.title.trim() === '') {
        showStatus('Заполните заголовок Hero', 'error');
        return;
    }
    for (var i = 0; i < data.stats.length; i++) {
        if (data.stats[i].value.trim() === '' || data.stats[i].label.trim() === '') {
            showStatus('Заполните все поля статистики', 'error');
            return;
        }
    }

    // 3) Отправляем PUT-запрос. Тело — JSON-строка.
    fetch('/api/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Сервер ответил ошибкой');
            }
            return response.json();
        })
        .then(function () {
            showStatus('Сохранено');
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

// Добавляет в Hero пустую строку статистики.
function addStat() {
    var statsList = document.querySelector('#hero-stats');
    var row = buildStatRow({ value: '', label: '' });
    statsList.appendChild(row);
    // Фокусируем первое поле — удобно сразу начать ввод.
    row.querySelector('.stats-value').focus();
}

// ─── Универсальные хелперы ─────────────────────────────────

// Создаёт пару <label> + <input>, возвращает фрагмент (label и input — соседние элементы).
// Используется во всех buildXxxCard, чтобы не повторять одно и то же.
// extraClasses — строка с дополнительными классами на input через пробел.
// dataSocial — необязательное значение для атрибута data-social (только для соц-ссылок).
function buildField(labelText, extraClasses, value, dataSocial) {
    var fragment = document.createDocumentFragment();

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input' + (extraClasses ? ' ' + extraClasses : '');
    input.value = value;
    if (dataSocial) {
        input.dataset.social = dataSocial;
    }

    fragment.appendChild(label);
    fragment.appendChild(input);
    return fragment;
}

// Создаёт пару кнопок "Сохранить" и "Удалить" в обёртке .card-actions.
// Обработчики не вешаем — будут в день 3, когда Никита поднимет POST/PUT/DELETE.
function buildCardActions() {
    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var save = document.createElement('button');
    save.className = 'btn primary';
    save.textContent = 'Сохранить';
    actions.appendChild(save);

    var del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Удалить';
    actions.appendChild(del);

    return actions;
}

// ─── Команда ────────────────────────────────────────────────

function renderTeam(team) {
    var list = document.querySelector('#team-list');
    list.innerHTML = '';
    for (var i = 0; i < team.length; i++) {
        var card = buildTeamCard(team[i], i + 1);
        list.appendChild(card);
    }
}

function buildTeamCard(member, index) {
    var card = document.createElement('div');
    card.className = 'card card--rounded team__item team__item-card';
    card.dataset.id = member.id;

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Сотрудник #' + index;
    card.appendChild(title);

    card.appendChild(buildField('Имя', 'team__item-title', member.name));
    card.appendChild(buildField('Должность', 'team__item-description', member.position));
    card.appendChild(buildField('Фото (путь)', 'team__item-image card__image', member.photo));

    // VK и Telegram — внутри обёртки .team__item-socials.
    var socials = document.createElement('div');
    socials.className = 'team__item-socials';
    socials.appendChild(buildField('VK', '', member.vk, 'vk'));
    socials.appendChild(buildField('Telegram', '', member.telegram, 'telegram'));
    card.appendChild(socials);

    card.appendChild(buildCardActions());
    return card;
}

// ─── Вакансии ───────────────────────────────────────────────

function renderVacancies(vacancies) {
    var list = document.querySelector('#vacancies-list');
    list.innerHTML = '';
    for (var i = 0; i < vacancies.length; i++) {
        var card = buildVacancyCard(vacancies[i], i + 1);
        list.appendChild(card);
    }
}

function buildVacancyCard(vacancy, index) {
    var card = document.createElement('div');
    card.className = 'card card--half-rounded vacancies__item';
    card.dataset.id = vacancy.id;

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Вакансия #' + index;
    card.appendChild(title);

    card.appendChild(buildField('Название', 'vacancies__item-title card__title heading heading--type-card', vacancy.title));
    card.appendChild(buildField('Формат / город', 'vacancies__item-address card__address', vacancy.format));
    card.appendChild(buildField('Ссылка на hh.ru', 'vacancies__item-lik card__footer-link', vacancy.url));

    card.appendChild(buildCardActions());
    return card;
}

// ─── Плюшки ─────────────────────────────────────────────────

function renderBenefits(benefits) {
    var list = document.querySelector('#benefits-list');
    list.innerHTML = '';
    for (var i = 0; i < benefits.length; i++) {
        var card = buildBenefitCard(benefits[i], i + 1);
        list.appendChild(card);
    }
}

function buildBenefitCard(benefit, index) {
    var card = document.createElement('div');
    // Модификатор bonus__item--N из списка участника 3.
    card.className = 'card card--default bonus__item bonus__item--' + index;
    card.dataset.id = benefit.id;

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Бонус #' + index;
    card.appendChild(title);

    card.appendChild(buildField('Название', 'bonus__item-title card__text', benefit.title));

    // Описание — это textarea, а не input. Хелпер не подходит, делаем вручную.
    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Описание';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input bonus__item-text';
    desc.rows = 3;
    desc.value = benefit.description;
    card.appendChild(desc);

    card.appendChild(buildCardActions());
    return card;
}

// ─── Привязка статических кнопок ────────────────────────────

function wireHero() {
    document.querySelector('#hero-add-stat').addEventListener('click', addStat);
    document.querySelector('#hero-save').addEventListener('click', saveHero);
}

// Запускаем загрузку и подвязываем обработчики, как только страница готова.
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    wireHero();
});
