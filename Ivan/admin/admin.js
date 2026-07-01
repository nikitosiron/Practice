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

function apiRequest(method, url, data) {
    var options = { method: method };
    if (data !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetch(url, options);
}

function parseApiResponse(response) {
    return response.json().then(function (body) {
        if (!body.success) {
            throw new Error(body.message || 'Сервер ответил ошибкой');
        }
        return body;
    });
}

var cachedPositions = [];
var cachedTeam = [];
var cachedVacancies = [];
var cachedGallery = [];
var cachedPlatform = [];

function loadData() {
    fetch('/api/data')
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные');
            }
            return response.json();
        })
        .then(function (data) {
            cachedPositions = data.positions || [];
            cachedTeam = data.team || [];
            cachedVacancies = data.vacancies || [];
            cachedGallery = data.gallery || [];
            cachedPlatform = data.platform || [];

            renderHeroForm(data.hero);
            renderTeam(cachedTeam);
            renderVacancies(cachedVacancies);
            renderBenefits(data.benefits);
            renderPositions(cachedPositions);
            renderGallery(cachedGallery);
            renderPlatform(cachedPlatform);
            updateStatCards(data);
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка загрузки: ' + error.message, 'error');
        });
}

var isDirty = false;

var sectionLabels = {
    hero: 'О нас',
    team: 'Сотрудники',
    positions: 'Должности',
    platform: 'Таймлайн платформы',
    vacancies: 'Вакансии',
    benefits: 'Плюшки',
    gallery: 'Фотогалерея'
};

function switchSection(name) {
    var blocks = document.querySelectorAll('.block');
    for (var i = 0; i < blocks.length; i++) {
        blocks[i].classList.remove('active');
    }
    var navItems = document.querySelectorAll('.nav-item[data-section]');
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove('active');
    }

    var block = document.querySelector('.block[data-block="' + name + '"]');
    var navItem = document.querySelector('.nav-item[data-section="' + name + '"]');
    if (block) block.classList.add('active');
    if (navItem) navItem.classList.add('active');

    document.querySelector('#breadcrumb').textContent = sectionLabels[name] || name;
    document.querySelector('#stat-active').textContent = sectionLabels[name] || name;
}

function wireSidebar() {
    var navItems = document.querySelectorAll('.nav-item[data-section]');
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function () {
            var target = this.getAttribute('data-section');

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

function updateStatCards(data) {
    document.querySelector('#stat-team').textContent = data.team.length;
    document.querySelector('#stat-vacancies').textContent = data.vacancies.length;
    document.querySelector('#stat-benefits').textContent = data.benefits.length;
}

function wireDirtyTracking() {
    document.body.addEventListener('input', function (event) {
        if (event.target.matches('input, textarea, select')) {
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
    del.className = 'btn danger small';
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
        showStatus('Заполните заголовок', 'error');
        return;
    }
    for (var i = 0; i < data.stats.length; i++) {
        if (data.stats[i].value.trim() === '' || data.stats[i].label.trim() === '') {
            showStatus('Заполните все поля статистики', 'error');
            return;
        }
    }

    apiRequest('PUT', '/api/hero', data)
        .then(parseApiResponse)
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

// ─── Универсальные хелперы ──────────────────────────────────

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

function buildSelectField(labelText, extraClasses, currentValue, options) {
    var fragment = document.createDocumentFragment();

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;

    var select = document.createElement('select');
    select.className = 'field-input' + (extraClasses ? ' ' + extraClasses : '');

    var hasMatch = false;
    for (var i = 0; i < options.length; i++) {
        var opt = document.createElement('option');
        opt.value = options[i];
        opt.textContent = options[i];
        if (options[i] === currentValue) {
            opt.selected = true;
            hasMatch = true;
        }
        select.appendChild(opt);
    }

    if (!hasMatch && currentValue) {
        var customOpt = document.createElement('option');
        customOpt.value = currentValue;
        customOpt.textContent = currentValue;
        customOpt.selected = true;
        select.insertBefore(customOpt, select.firstChild);
    }

    fragment.appendChild(label);
    fragment.appendChild(select);
    return fragment;
}

function buildCardActions(onSave, onDelete) {
    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var save = document.createElement('button');
    save.className = 'btn primary small';
    save.textContent = 'Сохранить';
    save.addEventListener('click', onSave);
    actions.appendChild(save);

    var del = document.createElement('button');
    del.className = 'btn danger small';
    del.textContent = 'Удалить';
    del.addEventListener('click', onDelete);
    actions.appendChild(del);

    return actions;
}

function buildActiveBadge(active) {
    var badge = document.createElement('span');
    var isActive = active !== false;
    badge.className = 'badge ' + (isActive ? 'badge-active' : 'badge-inactive');
    badge.textContent = isActive ? 'Активен' : 'Неактивен';
    return badge;
}

function buildToggleButton(active, onToggle) {
    var btn = document.createElement('button');
    var isActive = active !== false;
    btn.className = 'btn status-btn small';
    btn.textContent = isActive ? 'Деактивировать' : 'Активировать';
    btn.addEventListener('click', onToggle);
    return btn;
}

// ─── Команда ────────────────────────────────────────────────

function getTeamViewMode() {
    return localStorage.getItem('teamViewMode') || 'cards';
}

function setTeamViewMode(mode) {
    localStorage.setItem('teamViewMode', mode);
}

function filterTeam(team, query) {
    if (!query) return team;
    var q = query.toLowerCase();
    return team.filter(function (m) {
        return (m.name && m.name.toLowerCase().indexOf(q) !== -1) ||
               (m.position && m.position.toLowerCase().indexOf(q) !== -1);
    });
}

function renderTeam(team) {
    var query = document.querySelector('#team-search').value;
    var filtered = filterTeam(team, query);
    var mode = getTeamViewMode();

    var cardsList = document.querySelector('#team-list');
    var tableWrap = document.querySelector('#team-table-wrap');

    if (mode === 'table') {
        cardsList.style.display = 'none';
        tableWrap.style.display = 'block';
        renderTeamTable(filtered);
    } else {
        cardsList.style.display = '';
        tableWrap.style.display = 'none';
        renderTeamCards(filtered);
    }

    updateViewToggle(mode);
}

function renderTeamCards(team) {
    var list = document.querySelector('#team-list');
    list.innerHTML = '';
    for (var i = 0; i < team.length; i++) {
        list.appendChild(buildTeamCard(team[i], i + 1));
    }
}

function renderTeamTable(team) {
    var tbody = document.querySelector('#team-table-body');
    tbody.innerHTML = '';
    for (var i = 0; i < team.length; i++) {
        tbody.appendChild(buildTeamRow(team[i]));
    }
}

function updateViewToggle(mode) {
    var cardsBtn = document.querySelector('#view-cards');
    var tableBtn = document.querySelector('#view-table');
    if (mode === 'table') {
        cardsBtn.classList.remove('active');
        tableBtn.classList.add('active');
    } else {
        cardsBtn.classList.add('active');
        tableBtn.classList.remove('active');
    }
}

function buildPositionOptions() {
    var opts = [];
    for (var i = 0; i < cachedPositions.length; i++) {
        opts.push(cachedPositions[i].title);
    }
    return opts;
}

function buildInlinePositionAdd(card) {
    var wrap = document.createElement('div');
    wrap.className = 'inline-add';
    wrap.style.display = 'none';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input';
    input.placeholder = 'Новая должность...';
    wrap.appendChild(input);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Добавить';
    saveBtn.addEventListener('click', function () {
        var title = input.value.trim();
        if (!title) {
            showStatus('Введите название должности', 'error');
            return;
        }
        apiRequest('POST', '/api/positions', { title: title })
            .then(parseApiResponse)
            .then(function (body) {
                cachedPositions.push(body.data);
                var select = card.querySelector('.team__item-description');
                if (select) {
                    var opt = document.createElement('option');
                    opt.value = body.data.title;
                    opt.textContent = body.data.title;
                    opt.selected = true;
                    select.appendChild(opt);
                }
                wrap.style.display = 'none';
                input.value = '';
                showStatus('Должность добавлена');
            })
            .catch(function (error) {
                showStatus('Ошибка: ' + error.message, 'error');
            });
    });
    wrap.appendChild(saveBtn);

    return wrap;
}

function buildTeamCard(member, index) {
    var card = document.createElement('div');
    card.className = 'card card--rounded team__item team__item-card';
    card.dataset.id = member.id;
    if (member.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Сотрудник #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(member.active));
    card.appendChild(header);

    card.appendChild(buildField('Имя', 'team__item-title', member.name));
    card.appendChild(buildSelectField('Должность', 'team__item-description', member.position, buildPositionOptions()));

    var addPosBtn = document.createElement('button');
    addPosBtn.className = 'btn small';
    addPosBtn.textContent = '+ Новая должность';
    addPosBtn.style.marginTop = '4px';
    var inlineAdd = buildInlinePositionAdd(card);
    addPosBtn.addEventListener('click', function () {
        inlineAdd.style.display = inlineAdd.style.display === 'none' ? 'flex' : 'none';
    });
    card.appendChild(addPosBtn);
    card.appendChild(inlineAdd);

    card.appendChild(buildField('Фото (путь)', 'team__item-image card__image', member.photo));

    var socials = document.createElement('div');
    socials.className = 'team__item-socials';
    socials.appendChild(buildField('VK', '', member.vk, 'vk'));
    card.appendChild(socials);

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveTeamMember(member.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(member.active, function () {
        toggleTeamMemberActive(member.id, card, member.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteTeamMember(member.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function buildTeamRow(member) {
    var tr = document.createElement('tr');
    if (member.active === false) tr.style.opacity = '0.6';

    var tdPhoto = document.createElement('td');
    var img = document.createElement('img');
    img.className = 'table-photo';
    img.src = resolveSitePath(member.photo || 'upload/placeholder-avatar.svg');
    img.alt = member.name;
    tdPhoto.appendChild(img);
    tr.appendChild(tdPhoto);

    var tdName = document.createElement('td');
    tdName.textContent = member.name;
    tdName.className = 'table-cell-name';
    tr.appendChild(tdName);

    var tdPos = document.createElement('td');
    tdPos.textContent = member.position;
    tdPos.className = 'table-cell-position';
    tr.appendChild(tdPos);

    var tdStatus = document.createElement('td');
    tdStatus.appendChild(buildActiveBadge(member.active));
    tr.appendChild(tdStatus);

    var tdActions = document.createElement('td');
    var actionsDiv = document.createElement('div');
    actionsDiv.className = 'table-actions';

    var editBtn = document.createElement('button');
    editBtn.className = 'btn small';
    editBtn.textContent = 'Редактировать';
    editBtn.addEventListener('click', function () {
        switchSection('team');
        setTeamViewMode('cards');
        renderTeam(cachedTeam);
    });
    actionsDiv.appendChild(editBtn);

    actionsDiv.appendChild(buildToggleButton(member.active, function () {
        toggleTeamMemberActive(member.id, null, member.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteTeamMember(member.id); });
    actionsDiv.appendChild(delBtn);

    tdActions.appendChild(actionsDiv);
    tr.appendChild(tdActions);

    return tr;
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
    var member = findById(cachedTeam, id);
    data.active = member ? member.active !== false : true;

    if (data.name.trim() === '' || data.position.trim() === '' || data.photo.trim() === '') {
        showStatus('Заполните имя, должность и фото сотрудника', 'error');
        return;
    }

    apiRequest('PUT', '/api/team/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Сотрудник сохранён');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleTeamMemberActive(id, card, currentlyActive) {
    var member = findById(cachedTeam, id);
    if (!member) return;

    var data = {
        name: member.name,
        position: member.position,
        photo: member.photo,
        vk: member.vk,
        active: !currentlyActive
    };

    apiRequest('PUT', '/api/team/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Сотрудник деактивирован' : 'Сотрудник активирован');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addTeamMember() {
    apiRequest('POST', '/api/team', {
        name: 'Новый сотрудник',
        position: cachedPositions.length > 0 ? cachedPositions[0].title : 'Должность',
        photo: 'upload/placeholder-avatar.svg',
        vk: '#',
        active: true
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Сотрудник добавлен');
            loadData();
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
        .then(parseApiResponse)
        .then(function () {
            showStatus('Сотрудник удалён');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Вакансии ───────────────────────────────────────────────

function filterVacancies(vacancies, query) {
    if (!query) return vacancies;
    var q = query.toLowerCase();
    return vacancies.filter(function (v) {
        return v.title && v.title.toLowerCase().indexOf(q) !== -1;
    });
}

function renderVacancies(vacancies) {
    var query = document.querySelector('#vacancies-search').value;
    var filtered = filterVacancies(vacancies, query);
    var list = document.querySelector('#vacancies-list');
    list.innerHTML = '';
    for (var i = 0; i < filtered.length; i++) {
        list.appendChild(buildVacancyCard(filtered[i], i + 1));
    }
}

function buildVacancyCard(vacancy, index) {
    var card = document.createElement('div');
    card.className = 'card card--half-rounded vacancies__item';
    card.dataset.id = vacancy.id;
    if (vacancy.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Вакансия #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(vacancy.active));
    card.appendChild(header);

    card.appendChild(buildField('Название', 'vacancies__item-title card__title heading heading--type-card', vacancy.title));
    card.appendChild(buildField('Формат / город', 'vacancies__item-address card__address', vacancy.format));
    card.appendChild(buildField('Ссылка на hh.ru', 'vacancies__item-lik card__footer-link', vacancy.url));

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveVacancy(vacancy.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(vacancy.active, function () {
        toggleVacancyActive(vacancy.id, vacancy.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteVacancy(vacancy.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
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
    var vacancy = findById(cachedVacancies, id);
    data.active = vacancy ? vacancy.active !== false : true;

    if (data.title.trim() === '' || data.format.trim() === '' || data.url.trim() === '') {
        showStatus('Заполните все поля вакансии', 'error');
        return;
    }

    apiRequest('PUT', '/api/vacancies/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Вакансия сохранена');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleVacancyActive(id, currentlyActive) {
    var vacancy = findById(cachedVacancies, id);
    if (!vacancy) return;

    var data = {
        title: vacancy.title,
        format: vacancy.format,
        url: vacancy.url,
        active: !currentlyActive
    };

    apiRequest('PUT', '/api/vacancies/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Вакансия деактивирована' : 'Вакансия активирована');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addVacancy() {
    apiRequest('POST', '/api/vacancies', {
        title: 'Новая вакансия',
        format: 'удаленно',
        url: 'https://hh.ru',
        active: true
    })
        .then(parseApiResponse)
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
        .then(parseApiResponse)
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
    if (benefit.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Бонус #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(benefit.active));
    card.appendChild(header);

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

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveBenefit(benefit.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(benefit.active, function () {
        toggleBenefitActive(benefit.id, benefit.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteBenefit(benefit.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
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

    fetch('/api/data')
        .then(function (r) { return r.json(); })
        .then(function (allData) {
            var b = findById(allData.benefits, id);
            data.active = b ? b.active !== false : true;

            return apiRequest('PUT', '/api/benefits/' + id, data)
                .then(parseApiResponse)
                .then(function () {
                    showStatus('Бонус сохранён');
                    isDirty = false;
                    loadData();
                });
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleBenefitActive(id, currentlyActive) {
    fetch('/api/data')
        .then(function (r) { return r.json(); })
        .then(function (allData) {
            var benefit = findById(allData.benefits, id);
            if (!benefit) return;

            var data = {
                title: benefit.title,
                description: benefit.description,
                active: !currentlyActive
            };

            return apiRequest('PUT', '/api/benefits/' + id, data)
                .then(parseApiResponse)
                .then(function () {
                    showStatus(currentlyActive ? 'Бонус деактивирован' : 'Бонус активирован');
                    loadData();
                });
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addBenefit() {
    apiRequest('POST', '/api/benefits', {
        title: 'Новый бонус',
        description: 'Описание бонуса',
        active: true
    })
        .then(parseApiResponse)
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
        .then(parseApiResponse)
        .then(function () {
            showStatus('Бонус удалён');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Должности ──────────────────────────────────────────────

function renderPositions(positions) {
    var list = document.querySelector('#positions-list');
    list.innerHTML = '';
    for (var i = 0; i < positions.length; i++) {
        list.appendChild(buildPositionCard(positions[i], i + 1));
    }
}

function buildPositionCard(position, index) {
    var card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = position.id;

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Должность #' + index;
    card.appendChild(title);

    card.appendChild(buildField('Название', 'position-title', position.title));

    card.appendChild(buildCardActions(
        function () { savePosition(position.id, card); },
        function () { deletePosition(position.id); }
    ));
    return card;
}

function savePosition(id, card) {
    var title = card.querySelector('.position-title').value;

    if (title.trim() === '') {
        showStatus('Введите название должности', 'error');
        return;
    }

    apiRequest('PUT', '/api/positions/' + id, { title: title })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Должность сохранена');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addPosition() {
    apiRequest('POST', '/api/positions', { title: 'Новая должность' })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Должность добавлена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deletePosition(id) {
    if (!confirm('Удалить должность?')) {
        return;
    }

    apiRequest('DELETE', '/api/positions/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Должность удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Таймлайн платформы ─────────────────────────────────────
// Блок 3 из ТЗ практики ("Развиваем платформу"). Поля контракта
// зафиксированы публичной страницей Егора (dynamic-content.js:
// renderPlatform/createPlatformCard): year, title, subtitle,
// strategy, text, mark (путь к иконке из upload/marks/), type
// (номер варианта оформления — не выносим в форму, сервер сам
// сохраняет текущее значение при редактировании).

var PLATFORM_MARKS = [
    'upload/marks/billing.svg', 'upload/marks/binoculars.svg', 'upload/marks/booking.svg',
    'upload/marks/channel-manager.svg', 'upload/marks/crm-integration.svg', 'upload/marks/express.svg',
    'upload/marks/flower.svg', 'upload/marks/gms.svg', 'upload/marks/mobile-extranet.svg',
    'upload/marks/order-management.svg', 'upload/marks/partner-api.svg', 'upload/marks/price-optimizer.svg',
    'upload/marks/reactor.svg', 'upload/marks/reputation.svg', 'upload/marks/rocket.svg', 'upload/marks/star.svg'
];

function renderPlatform(platform) {
    var list = document.querySelector('#platform-list');
    list.innerHTML = '';
    for (var i = 0; i < platform.length; i++) {
        list.appendChild(buildPlatformCard(platform[i], i + 1));
    }
}

function buildPlatformCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    if (item.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Продукт #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(item.active));
    card.appendChild(header);

    card.appendChild(buildField('Год', 'platform__item-year', item.year));
    card.appendChild(buildField('Название продукта', 'platform__item-title', item.title));
    card.appendChild(buildSelectField('Тип метки (иконка)', 'platform__item-mark', item.mark, PLATFORM_MARKS));
    card.appendChild(buildField('Аудитория (например, B2B)', 'platform__item-strategy', item.strategy));
    card.appendChild(buildField('Подзаголовок', 'platform__item-subtitle', item.subtitle));

    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Описание';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input platform__item-text';
    desc.rows = 3;
    desc.value = item.text;
    card.appendChild(desc);

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { savePlatformItem(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        togglePlatformItemActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deletePlatformItem(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectPlatformData(card) {
    return {
        year: card.querySelector('.platform__item-year').value,
        title: card.querySelector('.platform__item-title').value,
        mark: card.querySelector('.platform__item-mark').value,
        strategy: card.querySelector('.platform__item-strategy').value,
        subtitle: card.querySelector('.platform__item-subtitle').value,
        text: card.querySelector('.platform__item-text').value
    };
}

function savePlatformItem(id, card) {
    var data = collectPlatformData(card);
    var item = findById(cachedPlatform, id);
    data.active = item ? item.active !== false : true;

    if (data.year.trim() === '' || data.title.trim() === '' || data.text.trim() === '') {
        showStatus('Заполните год, название продукта и описание', 'error');
        return;
    }

    apiRequest('PUT', '/api/platform/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка платформы сохранена');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function togglePlatformItemActive(id, currentlyActive) {
    var item = findById(cachedPlatform, id);
    if (!item) return;

    var data = {
        year: item.year,
        title: item.title,
        mark: item.mark,
        strategy: item.strategy,
        subtitle: item.subtitle,
        text: item.text,
        active: !currentlyActive
    };

    apiRequest('PUT', '/api/platform/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Карточка деактивирована' : 'Карточка активирована');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addPlatformItem() {
    apiRequest('POST', '/api/platform', {
        year: new Date().getFullYear().toString(),
        title: 'Новый продукт',
        mark: PLATFORM_MARKS[0],
        strategy: 'B2B',
        subtitle: '',
        text: 'Описание продукта',
        active: true
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка платформы добавлена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deletePlatformItem(id) {
    if (!confirm('Удалить карточку платформы?')) {
        return;
    }

    apiRequest('DELETE', '/api/platform/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка платформы удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Фотогалерея ────────────────────────────────────────────
// Блок 7 из ТЗ практики ("жизнь компании"). Поля item.image и
// item.caption — контракт, зафиксированный сервером Никиты
// (dataService.js: validateGalleryItem требует image + caption).
// Публичная страница Егора (dynamic-content.js) пока читает
// item.text — это нужно поправить на его стороне на item.caption,
// чтобы подписи фото отображались на сайте.

function renderGallery(gallery) {
    var list = document.querySelector('#gallery-list');
    list.innerHTML = '';
    for (var i = 0; i < gallery.length; i++) {
        list.appendChild(buildGalleryCard(gallery[i], i + 1));
    }
}

function buildGalleryCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card gallery__item';
    card.dataset.id = item.id;
    if (item.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Фото #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(item.active));
    card.appendChild(header);

    card.appendChild(buildField('Путь к изображению', 'gallery__item-image', item.image));
    card.appendChild(buildField('Подпись к фото', 'gallery__item-caption', item.caption));

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveGalleryItem(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        toggleGalleryItemActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteGalleryItem(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectGalleryData(card) {
    return {
        image: card.querySelector('.gallery__item-image').value,
        caption: card.querySelector('.gallery__item-caption').value
    };
}

function saveGalleryItem(id, card) {
    var data = collectGalleryData(card);
    var item = findById(cachedGallery, id);
    data.active = item ? item.active !== false : true;

    if (data.image.trim() === '' || data.caption.trim() === '') {
        showStatus('Заполните путь к изображению и подпись', 'error');
        return;
    }

    apiRequest('PUT', '/api/gallery/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото сохранено');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleGalleryItemActive(id, currentlyActive) {
    var item = findById(cachedGallery, id);
    if (!item) return;

    var data = {
        image: item.image,
        caption: item.caption,
        active: !currentlyActive
    };

    apiRequest('PUT', '/api/gallery/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Фото деактивировано' : 'Фото активировано');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addGalleryItem() {
    apiRequest('POST', '/api/gallery', {
        image: '',
        caption: 'Новая подпись',
        active: true
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото добавлено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteGalleryItem(id) {
    if (!confirm('Удалить фото?')) {
        return;
    }

    apiRequest('DELETE', '/api/gallery/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото удалено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// Массовое удаление — по одному DELETE на каждое фото, последовательно
// (чтобы не заваливать сервер параллельными записями в один и тот же файл).
function deleteAllGalleryItems() {
    if (cachedGallery.length === 0) {
        showStatus('Галерея уже пуста');
        return;
    }
    if (!confirm('Удалить все фото галереи (' + cachedGallery.length + ' шт.)? Это действие нельзя отменить.')) {
        return;
    }

    var ids = cachedGallery.map(function (item) { return item.id; });

    var chain = Promise.resolve();
    ids.forEach(function (id) {
        chain = chain.then(function () {
            return apiRequest('DELETE', '/api/gallery/' + id).then(parseApiResponse);
        });
    });

    chain
        .then(function () {
            showStatus('Вся галерея удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка при массовом удалении: ' + error.message, 'error');
            loadData();
        });
}

// ─── Утилиты ────────────────────────────────────────────────

// Пути к фото сотрудников в data.json относительные ("upload/...") и
// рассчитаны на публичную страницу, открытую с корня сайта. Админка
// открыта на /admin/, поэтому такой относительный путь резолвится
// браузером неверно (/admin/upload/...) — добавляем ведущий слэш,
// чтобы путь всегда резолвился от корня сайта.
function resolveSitePath(src) {
    if (!src) return src;
    if (/^(https?:)?\/\//.test(src) || src.indexOf('/') === 0) {
        return src;
    }
    return '/' + src;
}

function findById(arr, id) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === id) return arr[i];
    }
    return null;
}

// ─── Привязка статических кнопок ────────────────────────────

function wireStaticButtons() {
    document.querySelector('#hero-add-stat').addEventListener('click', addStat);
    document.querySelector('#hero-save').addEventListener('click', saveHero);
    document.querySelector('#team-add').addEventListener('click', addTeamMember);
    document.querySelector('#vacancies-add').addEventListener('click', addVacancy);
    document.querySelector('#benefits-add').addEventListener('click', addBenefit);
    document.querySelector('#positions-add').addEventListener('click', addPosition);
    document.querySelector('#platform-add').addEventListener('click', addPlatformItem);
    document.querySelector('#gallery-add').addEventListener('click', addGalleryItem);
    document.querySelector('#gallery-delete-all').addEventListener('click', deleteAllGalleryItems);
}

function wireViewToggle() {
    document.querySelector('#view-cards').addEventListener('click', function () {
        setTeamViewMode('cards');
        renderTeam(cachedTeam);
    });
    document.querySelector('#view-table').addEventListener('click', function () {
        setTeamViewMode('table');
        renderTeam(cachedTeam);
    });
}

function wireSearch() {
    document.querySelector('#team-search').addEventListener('input', function () {
        renderTeam(cachedTeam);
    });
    document.querySelector('#vacancies-search').addEventListener('input', function () {
        renderVacancies(cachedVacancies);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    wireStaticButtons();
    wireSidebar();
    wireDirtyTracking();
    wireViewToggle();
    wireSearch();
    loadData();
});