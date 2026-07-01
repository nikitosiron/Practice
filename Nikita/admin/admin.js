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
var cachedTimeline = [];
var cachedBrands = [];
var cachedWork = [];
var cachedDirections = [];

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
            cachedTimeline = data.timeline || [];
            cachedBrands = data.brands || [];
            cachedWork = data.work || [];
            cachedDirections = data.directions || [];

            renderHeroForm(data.hero);
            renderTeam(cachedTeam);
            renderVacancies(cachedVacancies);
            renderBenefits(data.benefits);
            renderPositions(cachedPositions);
            renderGallery(cachedGallery);
            renderTimeline(cachedTimeline);
            renderBrands(cachedBrands);
            renderWork(cachedWork);
            renderDirections(cachedDirections);
            renderContactForm(data.contactForm || { title: '', description: '', directions: [] });
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
    timeline: 'Таймлайн платформы',
    vacancies: 'Вакансии',
    benefits: 'Плюшки',
    gallery: 'Фотогалерея',
    brands: 'Партнёры',
    work: 'Офисы',
    directions: 'Направления',
    'contact-form': 'Контактная форма'
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

// Text field + "Загрузить..." button. Selecting a local file POSTs it to
// /api/upload as multipart/form-data; the server saves it under
// travelline_site/upload/user-uploads/ and returns the relative path, which we
// paste back into the text input. `extraClasses` is the same as buildField, so
// downstream collect*() code keeps reading `.className` selectors unchanged.
// `accept` defaults to image+video, override per-block if you want to restrict.
function buildFileUploadField(labelText, extraClasses, value, accept) {
    var fragment = document.createDocumentFragment();

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;
    fragment.appendChild(label);

    var row = document.createElement('div');
    row.className = 'file-upload-row';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input' + (extraClasses ? ' ' + extraClasses : '');
    input.value = value == null ? '' : String(value);
    row.appendChild(input);

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'file-upload-hidden';
    fileInput.accept = accept || 'image/*,video/*';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small';
    button.textContent = 'Загрузить...';
    button.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        button.disabled = true;
        var originalLabel = button.textContent;
        button.textContent = 'Загрузка...';

        var form = new FormData();
        form.append('file', file);

        fetch('/api/upload', { method: 'POST', body: form })
            .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
            .then(function (result) {
                if (result.ok && result.body && result.body.success && result.body.data && result.body.data.src) {
                    input.value = result.body.data.src;
                    showStatus('Файл загружен: ' + file.name);
                } else {
                    var msg = result.body && result.body.message ? result.body.message : 'неизвестная ошибка';
                    showStatus('Ошибка загрузки: ' + msg, 'error');
                }
            })
            .catch(function (err) {
                showStatus('Ошибка загрузки: ' + err.message, 'error');
            })
            .finally(function () {
                button.disabled = false;
                button.textContent = originalLabel;
                fileInput.value = '';  // allow re-uploading the same file
            });
    });

    row.appendChild(button);
    row.appendChild(fileInput);
    fragment.appendChild(row);
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

    card.appendChild(buildFileUploadField('Фото', 'team__item-image card__image', member.photo, 'image/*'));

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
// Блок 3 из ТЗ практики ("Развиваем платформу"). Контракт зафиксирован
// сервером Никиты (dataService.js: validateTimelineItem, /api/timeline,
// ключ data.timeline) — после ретрофита Дня 10 по просьбе Егора:
//   type      — строка, обязательно (например "product" / "event" / "milestone", без строгого enum)
//   year      — целое число, 1990-2100
//   mark      — строка, ОПЦИОНАЛЬНОЕ (метка/бейдж, дефолт "")
//   title     — строка, обязательно (бывшее name)
//   subtitle  — строка, обязательно
//   strategy  — строго один из B2B/B2C/B2E (бывшее category)
//   text      — строка, обязательно (бывшее description)
//   active    — boolean

var TIMELINE_STRATEGIES = ['B2B', 'B2C', 'B2E'];

// CSS palette variants icon-block--N, ripped from travelline_site/local/.../style.min.css.
// Value = the string that lands in item.type; label = short human-readable colour name;
// color = the hex used by that .icon-block--N (used for the swatch preview only).
// Variants without an explicit background-color in the source stylesheet fall back to
// the base .icon-block__icon colour (#507bce), which is why several rows share it.
var TIMELINE_COLOR_VARIANTS = [
  { value: '1',  color: '#507bce', label: 'Синий (по умолч.)' },
  { value: '2',  color: '#227bdd', label: 'Синий 2' },
  { value: '3',  color: '#507bce', label: 'Синий 3' },
  { value: '4',  color: '#507bce', label: 'Синий 4' },
  { value: '5',  color: '#507bce', label: 'Синий 5' },
  { value: '6',  color: '#a456c3', label: 'Фиолетовый' },
  { value: '8',  color: '#507bce', label: 'Синий 8' },
  { value: '9',  color: '#20a781', label: 'Изумрудный' },
  { value: '10', color: '#6667d4', label: 'Индиго' },
  { value: '11', color: '#eb4836', label: 'Красный' },
  { value: '12', color: '#48af45', label: 'Зелёный' },
  { value: '13', color: '#507bce', label: 'Синий 13' },
  { value: '14', color: '#b9d950', label: 'Лаймовый' },
  { value: '15', color: '#00a2bc', label: 'Бирюзовый' },
  { value: '16', color: '#d86ab3', label: 'Розовый' },
  { value: '17', color: '#507bce', label: 'Синий 17' },
  { value: '18', color: '#507bce', label: 'Синий 18' },
  { value: '19', color: '#227bdd', label: 'Синий 19' },
  { value: '20', color: '#507bce', label: 'Синий 20' },
  { value: '21', color: '#507bce', label: 'Синий 21' }
];

// Renders a palette of clickable colour swatches plus a hidden input holding the
// selected value. The hidden input keeps class `timeline__item-type` so that
// collectTimelineData() reads it exactly like a normal <input> — no logic changes
// downstream. Clicking a swatch flips the .selected class and updates the input.
function buildTimelineColorField(currentValue) {
  var wrapper = document.createElement('div');
  wrapper.className = 'field-block';

  var label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = 'Цвет карточки';
  wrapper.appendChild(label);

  var hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.className = 'field-input timeline__item-type';
  hidden.value = String(currentValue == null ? '' : currentValue);
  wrapper.appendChild(hidden);

  var palette = document.createElement('div');
  palette.className = 'color-swatches';

  TIMELINE_COLOR_VARIANTS.forEach(function (variant) {
    var swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = variant.color;
    swatch.title = variant.label + ' (icon-block--' + variant.value + ')';
    swatch.textContent = variant.value;
    if (String(variant.value) === String(currentValue)) {
      swatch.classList.add('selected');
    }
    swatch.addEventListener('click', function () {
      hidden.value = variant.value;
      palette.querySelectorAll('.color-swatch.selected').forEach(function (n) {
        n.classList.remove('selected');
      });
      swatch.classList.add('selected');
    });
    palette.appendChild(swatch);
  });

  wrapper.appendChild(palette);
  return wrapper;
}

function renderTimeline(timeline) {
    var list = document.querySelector('#timeline-list');
    list.innerHTML = '';
    for (var i = 0; i < timeline.length; i++) {
        list.appendChild(buildTimelineCard(timeline[i], i + 1));
    }
}

function buildTimelineCard(item, index) {
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

    card.appendChild(buildTimelineColorField(item.type));
    card.appendChild(buildField('Год', 'timeline__item-year', item.year));
    card.appendChild(buildFileUploadField('Метка (иконка, опционально)', 'timeline__item-mark', item.mark || '', 'image/*'));
    card.appendChild(buildField('Название', 'timeline__item-title', item.title));
    card.appendChild(buildField('Подзаголовок', 'timeline__item-subtitle', item.subtitle));
    card.appendChild(buildSelectField('Стратегический сегмент', 'timeline__item-strategy', item.strategy, TIMELINE_STRATEGIES));

    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Описание';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input timeline__item-text';
    desc.rows = 3;
    desc.value = item.text;
    card.appendChild(desc);

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveTimelineItem(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        toggleTimelineItemActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteTimelineItem(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectTimelineData(card) {
    return {
        type: card.querySelector('.timeline__item-type').value,
        year: Number(card.querySelector('.timeline__item-year').value),
        mark: card.querySelector('.timeline__item-mark').value,
        title: card.querySelector('.timeline__item-title').value,
        subtitle: card.querySelector('.timeline__item-subtitle').value,
        strategy: card.querySelector('.timeline__item-strategy').value,
        text: card.querySelector('.timeline__item-text').value
    };
}

function saveTimelineItem(id, card) {
    var data = collectTimelineData(card);
    var item = findById(cachedTimeline, id);
    data.active = item ? item.active !== false : true;

    if (!Number.isInteger(data.year) || data.year < 1990 || data.year > 2100) {
        showStatus('Год должен быть целым числом от 1990 до 2100', 'error');
        return;
    }
    if (data.type.trim() === '') {
        showStatus('Заполните тип записи', 'error');
        return;
    }
    if (data.title.trim() === '' || data.subtitle.trim() === '' || data.text.trim() === '') {
        showStatus('Заполните название, подзаголовок и описание', 'error');
        return;
    }

    apiRequest('PUT', '/api/timeline/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка таймлайна сохранена');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleTimelineItemActive(id, currentlyActive) {
    var item = findById(cachedTimeline, id);
    if (!item) return;

    var data = {
        type: item.type,
        year: item.year,
        mark: item.mark || '',
        title: item.title,
        subtitle: item.subtitle,
        strategy: item.strategy,
        text: item.text,
        active: !currentlyActive
    };

    apiRequest('PUT', '/api/timeline/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Карточка деактивирована' : 'Карточка активирована');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addTimelineItem() {
    apiRequest('POST', '/api/timeline', {
        type: '1',
        year: new Date().getFullYear(),
        mark: '',
        title: 'Новый продукт',
        subtitle: 'Подзаголовок',
        strategy: 'B2B',
        text: 'Описание продукта',
        active: true
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка таймлайна добавлена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteTimelineItem(id) {
    if (!confirm('Удалить карточку таймлайна?')) {
        return;
    }

    apiRequest('DELETE', '/api/timeline/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Карточка таймлайна удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Фотогалерея ────────────────────────────────────────────
// Блок 7 из ТЗ практики ("жизнь компании"). Контракт зафиксирован
// сервером Никиты (dataService.js: validateGalleryItem): src, type
// (строго "image" или "video"), caption, active.

var GALLERY_TYPES = ['image', 'video'];

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

    card.appendChild(buildFileUploadField('Файл (изображение или видео)', 'gallery__item-src', item.src));
    card.appendChild(buildSelectField('Тип файла', 'gallery__item-type', item.type, GALLERY_TYPES));
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
        src: card.querySelector('.gallery__item-src').value,
        type: card.querySelector('.gallery__item-type').value,
        caption: card.querySelector('.gallery__item-caption').value
    };
}

function saveGalleryItem(id, card) {
    var data = collectGalleryData(card);
    var item = findById(cachedGallery, id);
    data.active = item ? item.active !== false : true;

    if (data.src.trim() === '' || data.caption.trim() === '') {
        showStatus('Заполните путь к файлу и подпись', 'error');
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
        src: item.src,
        type: item.type,
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
        src: 'upload/placeholder-avatar.svg',
        type: 'image',
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

// ─── Логотипы партнёров и клиентов (блок 4) ─────────────────
// Контракт сервера (dataService.js: validateBrand): src, name, active.

function renderBrands(brands) {
    var list = document.querySelector('#brands-list');
    list.innerHTML = '';
    for (var i = 0; i < brands.length; i++) {
        list.appendChild(buildBrandCard(brands[i], i + 1));
    }
}

function buildBrandCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card brands__item';
    card.dataset.id = item.id;
    if (item.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Логотип #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(item.active));
    card.appendChild(header);

    card.appendChild(buildFileUploadField('Логотип', 'brands__item-src', item.src, 'image/*'));
    card.appendChild(buildField('Название компании', 'brands__item-name', item.name));

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveBrand(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        toggleBrandActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteBrand(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectBrandData(card) {
    return {
        src: card.querySelector('.brands__item-src').value,
        name: card.querySelector('.brands__item-name').value
    };
}

function saveBrand(id, card) {
    var data = collectBrandData(card);
    var item = findById(cachedBrands, id);
    data.active = item ? item.active !== false : true;

    if (data.src.trim() === '' || data.name.trim() === '') {
        showStatus('Заполните путь к логотипу и название', 'error');
        return;
    }

    apiRequest('PUT', '/api/brands/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Логотип сохранён');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleBrandActive(id, currentlyActive) {
    var item = findById(cachedBrands, id);
    if (!item) return;

    apiRequest('PUT', '/api/brands/' + id, { src: item.src, name: item.name, active: !currentlyActive })
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Логотип деактивирован' : 'Логотип активирован');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addBrand() {
    apiRequest('POST', '/api/brands', { src: 'upload/placeholder-avatar.svg', name: 'Новый партнёр', active: true })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Логотип добавлен');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteBrand(id) {
    if (!confirm('Удалить логотип?')) {
        return;
    }

    apiRequest('DELETE', '/api/brands/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Логотип удалён');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Офисы «Работай как удобно» (блок 8) ────────────────────
// Контракт сервера (dataService.js: validateWorkItem): image, caption, active.

function renderWork(work) {
    var list = document.querySelector('#work-list');
    list.innerHTML = '';
    for (var i = 0; i < work.length; i++) {
        list.appendChild(buildWorkCard(work[i], i + 1));
    }
}

function buildWorkCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card work__item';
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

    card.appendChild(buildFileUploadField('Фото', 'work__item-image', item.image, 'image/*'));

    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Подпись';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input work__item-caption';
    desc.rows = 2;
    desc.value = item.caption;
    card.appendChild(desc);

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveWorkItem(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        toggleWorkItemActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteWorkItem(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectWorkData(card) {
    return {
        image: card.querySelector('.work__item-image').value,
        caption: card.querySelector('.work__item-caption').value
    };
}

function saveWorkItem(id, card) {
    var data = collectWorkData(card);
    var item = findById(cachedWork, id);
    data.active = item ? item.active !== false : true;

    if (data.image.trim() === '' || data.caption.trim() === '') {
        showStatus('Заполните путь к фото и подпись', 'error');
        return;
    }

    apiRequest('PUT', '/api/work/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото офиса сохранено');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleWorkItemActive(id, currentlyActive) {
    var item = findById(cachedWork, id);
    if (!item) return;

    apiRequest('PUT', '/api/work/' + id, { image: item.image, caption: item.caption, active: !currentlyActive })
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Фото деактивировано' : 'Фото активировано');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addWorkItem() {
    apiRequest('POST', '/api/work', { image: 'upload/placeholder-avatar.svg', caption: 'Новая подпись', active: true })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото офиса добавлено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteWorkItem(id) {
    if (!confirm('Удалить фото офиса?')) {
        return;
    }

    apiRequest('DELETE', '/api/work/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Фото офиса удалено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Направления (блок 5) ────────────────────────────────────
// Контракт сервера (dataService.js: validateDirection): title,
// description, technologies: [{name, icon}], active.

function renderDirections(directions) {
    var list = document.querySelector('#directions-list');
    list.innerHTML = '';
    for (var i = 0; i < directions.length; i++) {
        list.appendChild(buildDirectionCard(directions[i], i + 1));
    }
}

function buildTechnologyRow(tech) {
    var row = document.createElement('div');
    row.className = 'stats-row';

    var name = document.createElement('input');
    name.type = 'text';
    name.className = 'field-input tech-name';
    name.placeholder = 'Название (например, React)';
    name.value = tech.name;
    row.appendChild(name);

    var icon = document.createElement('input');
    icon.type = 'text';
    icon.className = 'field-input tech-icon';
    icon.placeholder = 'Путь к иконке';
    icon.value = tech.icon;
    row.appendChild(icon);

    var del = document.createElement('button');
    del.className = 'btn danger small';
    del.textContent = 'Удалить';
    del.addEventListener('click', function () {
        row.remove();
    });
    row.appendChild(del);

    return row;
}

function buildDirectionCard(item, index) {
    var card = document.createElement('div');
    card.className = 'card directions__item';
    card.style.maxWidth = 'none';
    card.style.flexBasis = '100%';
    card.dataset.id = item.id;
    if (item.active === false) card.classList.add('inactive');

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';

    var title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = 'Направление #' + index;
    title.style.margin = '0';
    header.appendChild(title);

    header.appendChild(buildActiveBadge(item.active));
    card.appendChild(header);

    card.appendChild(buildField('Название направления', 'directions__item-title', item.title));

    var descLabel = document.createElement('label');
    descLabel.className = 'field-label';
    descLabel.textContent = 'Описание';
    card.appendChild(descLabel);

    var desc = document.createElement('textarea');
    desc.className = 'field-input directions__item-description';
    desc.rows = 3;
    desc.value = item.description;
    card.appendChild(desc);

    var techLabel = document.createElement('h4');
    techLabel.className = 'subsection-title';
    techLabel.textContent = 'Технологии';
    card.appendChild(techLabel);

    var techList = document.createElement('div');
    techList.className = 'stats-list directions__item-technologies';
    for (var i = 0; i < item.technologies.length; i++) {
        techList.appendChild(buildTechnologyRow(item.technologies[i]));
    }
    card.appendChild(techList);

    var addTechBtn = document.createElement('button');
    addTechBtn.className = 'btn small';
    addTechBtn.textContent = '+ Добавить технологию';
    addTechBtn.style.marginBottom = '10px';
    addTechBtn.addEventListener('click', function () {
        var row = buildTechnologyRow({ name: '', icon: '' });
        techList.appendChild(row);
        row.querySelector('.tech-name').focus();
    });
    card.appendChild(addTechBtn);

    var actions = document.createElement('div');
    actions.className = 'card-actions';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn primary small';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () { saveDirection(item.id, card); });
    actions.appendChild(saveBtn);

    actions.appendChild(buildToggleButton(item.active, function () {
        toggleDirectionActive(item.id, item.active !== false);
    }));

    var delBtn = document.createElement('button');
    delBtn.className = 'btn danger small';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', function () { deleteDirection(item.id); });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    return card;
}

function collectDirectionData(card) {
    var technologies = [];
    var rows = card.querySelectorAll('.directions__item-technologies .stats-row');
    for (var i = 0; i < rows.length; i++) {
        technologies.push({
            name: rows[i].querySelector('.tech-name').value,
            icon: rows[i].querySelector('.tech-icon').value
        });
    }
    return {
        title: card.querySelector('.directions__item-title').value,
        description: card.querySelector('.directions__item-description').value,
        technologies: technologies
    };
}

function saveDirection(id, card) {
    var data = collectDirectionData(card);
    var item = findById(cachedDirections, id);
    data.active = item ? item.active !== false : true;

    if (data.title.trim() === '' || data.description.trim() === '') {
        showStatus('Заполните название и описание направления', 'error');
        return;
    }
    for (var i = 0; i < data.technologies.length; i++) {
        if (data.technologies[i].name.trim() === '' || data.technologies[i].icon.trim() === '') {
            showStatus('Заполните все поля технологий или удалите пустые строки', 'error');
            return;
        }
    }

    apiRequest('PUT', '/api/directions/' + id, data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Направление сохранено');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function toggleDirectionActive(id, currentlyActive) {
    var item = findById(cachedDirections, id);
    if (!item) return;

    apiRequest('PUT', '/api/directions/' + id, {
        title: item.title,
        description: item.description,
        technologies: item.technologies,
        active: !currentlyActive
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus(currentlyActive ? 'Направление деактивировано' : 'Направление активировано');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function addDirection() {
    apiRequest('POST', '/api/directions', {
        title: 'Новое направление',
        description: 'Описание направления',
        technologies: [],
        active: true
    })
        .then(parseApiResponse)
        .then(function () {
            showStatus('Направление добавлено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка добавления: ' + error.message, 'error');
        });
}

function deleteDirection(id) {
    if (!confirm('Удалить направление?')) {
        return;
    }

    apiRequest('DELETE', '/api/directions/' + id)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Направление удалено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Контактная форма «Напиши нам» (блок 10) ────────────────
// Контракт сервера (dataService.js: validateContactForm): title,
// description, directions: [строки]. Это singleton-объект (не список),
// поэтому раздел оформлен как форма, а не как карточки — по образцу Hero.
// Только PUT /api/contact-form, добавления/удаления карточек нет.

function renderContactForm(form) {
    document.querySelector('#contact-form-title').value = form.title || '';
    document.querySelector('#contact-form-description').value = form.description || '';

    var list = document.querySelector('#contact-form-directions');
    list.innerHTML = '';
    var directions = form.directions || [];
    for (var i = 0; i < directions.length; i++) {
        list.appendChild(buildContactFormDirectionRow(directions[i]));
    }
}

function buildContactFormDirectionRow(value) {
    var row = document.createElement('div');
    row.className = 'stats-row';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input contact-form-direction';
    input.value = value;
    row.appendChild(input);

    var del = document.createElement('button');
    del.className = 'btn danger small';
    del.textContent = 'Удалить';
    del.addEventListener('click', function () {
        row.remove();
    });
    row.appendChild(del);

    return row;
}

function collectContactFormData() {
    var directions = [];
    var rows = document.querySelectorAll('#contact-form-directions .stats-row');
    for (var i = 0; i < rows.length; i++) {
        directions.push(rows[i].querySelector('.contact-form-direction').value);
    }
    return {
        title: document.querySelector('#contact-form-title').value,
        description: document.querySelector('#contact-form-description').value,
        directions: directions
    };
}

function saveContactForm() {
    var data = collectContactFormData();

    if (data.title.trim() === '' || data.description.trim() === '') {
        showStatus('Заполните заголовок и описание', 'error');
        return;
    }
    if (data.directions.length === 0) {
        showStatus('Добавьте хотя бы один пункт в список направлений', 'error');
        return;
    }
    for (var i = 0; i < data.directions.length; i++) {
        if (data.directions[i].trim() === '') {
            showStatus('Заполните все пункты списка или удалите пустые', 'error');
            return;
        }
    }

    apiRequest('PUT', '/api/contact-form', data)
        .then(parseApiResponse)
        .then(function () {
            showStatus('Контактная форма сохранена');
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

function addContactFormDirection() {
    var list = document.querySelector('#contact-form-directions');
    var row = buildContactFormDirectionRow('');
    list.appendChild(row);
    row.querySelector('.contact-form-direction').focus();
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
    document.querySelector('#timeline-add').addEventListener('click', addTimelineItem);
    document.querySelector('#gallery-add').addEventListener('click', addGalleryItem);
    document.querySelector('#gallery-delete-all').addEventListener('click', deleteAllGalleryItems);
    document.querySelector('#brands-add').addEventListener('click', addBrand);
    document.querySelector('#work-add').addEventListener('click', addWorkItem);
    document.querySelector('#directions-add').addEventListener('click', addDirection);
    document.querySelector('#contact-form-add-direction').addEventListener('click', addContactFormDirection);
    document.querySelector('#contact-form-save').addEventListener('click', saveContactForm);
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