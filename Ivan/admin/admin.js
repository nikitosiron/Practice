// Показывает сообщение в строке статуса под заголовком админки.
// message — текст, type — 'success' или 'error' (влияет на цвет через CSS).
function showStatus(message, type) {
    if (type === undefined) {
        type = 'success';
    }
    var status = document.querySelector('#status');
    if (!status) {
        return;
    }
    status.textContent = message;
    status.className = 'status ' + type;
}

// Универсальный fetch-обёртка для POST/PUT/DELETE/GET с JSON-телом.
// Возвращает промис response (как обычный fetch).
function apiRequest(method, url, data) {
    var options = { method: method };
    if (data !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetch(url, options);
}

// Загружает все данные сайта с сервера и раскладывает их по секциям админки.
function loadData() {
    fetch('/api/data')
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные');
            }
            return response.json();
        })
        .then(function (data) {
            renderHeroForm(data.hero);
            renderTeam(data.team);
            renderVacancies(data.vacancies);
            renderBenefits(data.benefits);
            updateStatCards(data);
            isDirty = false;  // данные свежие — состояние формы чистое
        })
        .catch(function (error) {
            showStatus('Ошибка загрузки: ' + error.message, 'error');
        });
}

// ─── Навигация и UI-обвязка ────────────────────────────────

// Состояние: грязная ли форма (есть ли несохранённые изменения).
var isDirty = false;

// Метки для хлебной крошки и stat-карточки "Активный блок".
var sectionLabels = {
    hero: 'Hero',
    team: 'Команда',
    vacancies: 'Вакансии',
    benefits: 'Плюшки'
};

// Переключает видимый блок и обновляет nav/breadcrumb/stat.
function switchSection(name) {
    // Все .block — скрыть, .nav-item — снять active.
    var blocks = document.querySelectorAll('.block');
    for (var i = 0; i < blocks.length; i++) {
        blocks[i].classList.remove('active');
    }
    var navItems = document.querySelectorAll('.nav-item[data-section]');
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove('active');
    }

    // Включить нужный блок и nav-item.
    var block = document.querySelector('.block[data-block="' + name + '"]');
    var navItem = document.querySelector('.nav-item[data-section="' + name + '"]');
    if (block) block.classList.add('active');
    if (navItem) navItem.classList.add('active');

    // Обновить breadcrumb и stat-карточку.
    document.querySelector('#breadcrumb').textContent = sectionLabels[name] || name;
    document.querySelector('#stat-active').textContent = sectionLabels[name] || name;
}

// Вешает обработчики на кнопки сайдбара.
function wireSidebar() {
    var navItems = document.querySelectorAll('.nav-item[data-section]');
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function () {
            var target = this.getAttribute('data-section');

            // Если форма грязная — предупреждаем при переключении.
            if (isDirty) {
                if (!confirm('Есть несохранённые изменения. Переключиться без сохранения?')) {
                    return;
                }
                isDirty = false;
            }

            switchSection(target);
        });
    }
}

// Обновляет счётчики в stat-карточках после loadData.
function updateStatCards(data) {
    document.querySelector('#stat-team').textContent = data.team.length;
    document.querySelector('#stat-vacancies').textContent = data.vacancies.length;
    document.querySelector('#stat-benefits').textContent = data.benefits.length;
}

// Отслеживает изменения в формах — выставляет isDirty = true.
// Слушаем на body через делегирование: ловим любой input/change в любом поле.
function wireDirtyTracking() {
    document.body.addEventListener('input', function (event) {
        if (event.target.matches('input, textarea')) {
            isDirty = true;
        }
    });
}

// ─── Hero ───────────────────────────────────────────────────

function renderHeroForm(hero) {
    document.querySelector('#hero-title').value = hero.title;

    var statsList = document.querySelector('#hero-stats');
    statsList.innerHTML = '';
    for (var i = 0; i < hero.stats.length; i++) {
        statsList.appendChild(buildStatRow(hero.stats[i]));
    }
}

function buildStatRow(stat) {
    var row = document.createElement('div');
    row.className = 'stats-row advantages__item';

    var value = document.createElement('input');
    value.type = 'text';
    value.className = 'field-input stats-value advantages__item-title';
    value.value = stat.value;
    row.appendChild(value);

    var label = document.createElement('input');
    label.type = 'text';
    label.className = 'field-input stats-label';
    label.value = stat.label;
    row.appendChild(label);

    var del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Удалить';
    del.addEventListener('click', function () {
        row.remove();
    });
    row.appendChild(del);

    return row;
}

function collectHeroData() {
    var title = document.querySelector('#hero-title').value;
    var stats = [];
    var rows = document.querySelectorAll('#hero-stats .stats-row');
    for (var i = 0; i < rows.length; i++) {
        stats.push({
            value: rows[i].querySelector('.stats-value').value,
            label: rows[i].querySelector('.stats-label').value
        });
    }
    return { title: title, stats: stats };
}

function saveHero() {
    var data = collectHeroData();

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

    apiRequest('PUT', '/api/hero', data)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Сохранено');
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addStat() {
    var statsList = document.querySelector('#hero-stats');
    var row = buildStatRow({ value: '', label: '' });
    statsList.appendChild(row);
    row.querySelector('.stats-value').focus();
}

// ─── Универсальные хелперы для карточек ────────────────────

// Создаёт пару <label> + <input>, возвращает фрагмент.
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

// Создаёт пару кнопок "Сохранить" и "Удалить".
// onSave и onDelete — функции-обработчики кликов.
function buildCardActions(onSave, onDelete) {
    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var save = document.createElement('button');
    save.className = 'btn primary';
    save.textContent = 'Сохранить';
    save.addEventListener('click', onSave);
    actions.appendChild(save);

    var del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Удалить';
    del.addEventListener('click', onDelete);
    actions.appendChild(del);

    return actions;
}

// ─── Команда ────────────────────────────────────────────────

function renderTeam(team) {
    var list = document.querySelector('#team-list');
    list.innerHTML = '';
    for (var i = 0; i < team.length; i++) {
        list.appendChild(buildTeamCard(team[i], i + 1));
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

    var socials = document.createElement('div');
    socials.className = 'team__item-socials';
    socials.appendChild(buildField('VK', '', member.vk, 'vk'));
    card.appendChild(socials);

    // Обработчики save/delete используют замыкания на member.id и card.
    card.appendChild(buildCardActions(
        function () { saveTeamMember(member.id, card); },
        function () { deleteTeamMember(member.id); }
    ));
    return card;
}

function collectTeamData(card) {
    return {
        name: card.querySelector('.team__item-title').value,
        position: card.querySelector('.team__item-description').value,
        photo: card.querySelector('.team__item-image').value,
        vk: card.querySelector('[data-social="vk"]').value
    };
}

function saveTeamMember(id, card) {
    var data = collectTeamData(card);

    if (data.name.trim() === '' || data.position.trim() === '' || data.photo.trim() === '') {
        showStatus('Заполните имя, должность и фото сотрудника', 'error');
        return;
    }

    apiRequest('PUT', '/api/team/' + id, data)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Сотрудник сохранён');
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addTeamMember() {
    apiRequest('POST', '/api/team', {
        name: 'Новый сотрудник',
        position: 'Должность',
        photo: '',
        vk: '#'
    })
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Сотрудник добавлен');
            loadData();  // перерисуем список с актуальными данными
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteTeamMember(id) {
    if (!confirm('Удалить сотрудника?')) {
        return;
    }

    apiRequest('DELETE', '/api/team/' + id)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
        })
        .then(function () {
            showStatus('Сотрудник удалён');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Вакансии ───────────────────────────────────────────────

function renderVacancies(vacancies) {
    var list = document.querySelector('#vacancies-list');
    list.innerHTML = '';
    for (var i = 0; i < vacancies.length; i++) {
        list.appendChild(buildVacancyCard(vacancies[i], i + 1));
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

    card.appendChild(buildCardActions(
        function () { saveVacancy(vacancy.id, card); },
        function () { deleteVacancy(vacancy.id); }
    ));
    return card;
}

function collectVacancyData(card) {
    return {
        title: card.querySelector('.vacancies__item-title').value,
        format: card.querySelector('.vacancies__item-address').value,
        url: card.querySelector('.vacancies__item-lik').value
    };
}

function saveVacancy(id, card) {
    var data = collectVacancyData(card);

    if (data.title.trim() === '' || data.format.trim() === '' || data.url.trim() === '') {
        showStatus('Заполните все поля вакансии', 'error');
        return;
    }

    apiRequest('PUT', '/api/vacancies/' + id, data)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Вакансия сохранена');
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addVacancy() {
    apiRequest('POST', '/api/vacancies', {
        title: 'Новая вакансия',
        format: 'удаленно',
        url: 'https://hh.ru'
    })
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Вакансия добавлена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteVacancy(id) {
    if (!confirm('Удалить вакансию?')) {
        return;
    }

    apiRequest('DELETE', '/api/vacancies/' + id)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
        })
        .then(function () {
            showStatus('Вакансия удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Плюшки ─────────────────────────────────────────────────

function renderBenefits(benefits) {
    var list = document.querySelector('#benefits-list');
    list.innerHTML = '';
    for (var i = 0; i < benefits.length; i++) {
        list.appendChild(buildBenefitCard(benefits[i], i + 1));
    }
}

function buildBenefitCard(benefit, index) {
    var card = document.createElement('div');
    card.className = 'card card--default bonus__item bonus__item--' + index;
    card.dataset.id = benefit.id;

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Бонус #' + index;
    card.appendChild(title);

    card.appendChild(buildField('Название', 'bonus__item-title card__text', benefit.title));

    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Описание';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input bonus__item-text';
    desc.rows = 3;
    desc.value = benefit.description;
    card.appendChild(desc);

    card.appendChild(buildCardActions(
        function () { saveBenefit(benefit.id, card); },
        function () { deleteBenefit(benefit.id); }
    ));
    return card;
}

function collectBenefitData(card) {
    return {
        title: card.querySelector('.bonus__item-title').value,
        description: card.querySelector('.bonus__item-text').value
    };
}

function saveBenefit(id, card) {
    var data = collectBenefitData(card);

    if (data.title.trim() === '' || data.description.trim() === '') {
        showStatus('Заполните название и описание бонуса', 'error');
        return;
    }

    apiRequest('PUT', '/api/benefits/' + id, data)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Бонус сохранён');
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addBenefit() {
    apiRequest('POST', '/api/benefits', {
        title: 'Новый бонус',
        description: 'Описание бонуса'
    })
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
            return response.json();
        })
        .then(function () {
            showStatus('Бонус добавлен');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteBenefit(id) {
    if (!confirm('Удалить бонус?')) {
        return;
    }

    apiRequest('DELETE', '/api/benefits/' + id)
        .then(function (response) {
            if (!response.ok) throw new Error('Сервер ответил ошибкой');
        })
        .then(function () {
            showStatus('Бонус удалён');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Привязка статических кнопок ────────────────────────────

function wireStaticButtons() {
    document.querySelector('#hero-add-stat').addEventListener('click', addStat);
    document.querySelector('#hero-save').addEventListener('click', saveHero);
    document.querySelector('#team-add').addEventListener('click', addTeamMember);
    document.querySelector('#vacancies-add').addEventListener('click', addVacancy);
    document.querySelector('#benefits-add').addEventListener('click', addBenefit);
}

document.addEventListener('DOMContentLoaded', function () {
    wireStaticButtons();
    wireSidebar();
    wireDirtyTracking();
    loadData();
});
