// ─── Базовые утилиты ────────────────────────────────────────

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
    var options = { method: method, credentials: 'same-origin' };
    if (data !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
    }
    return fetch(url, options).then(function (response) {
        if (response.status === 401) {
            window.location.href = '/admin/login/';
            throw new Error('Требуется авторизация');
        }
        return response;
    });
}

// Сервер всегда отвечает JSON вида { success, data } или { success: false, message }.
// Если success === false — бросаем Error с реальным текстом от сервера,
// и он улетает в .catch() цепочки.
function parseApiResponse(response) {
    return response.json().then(function (body) {
        if (!body.success) {
            throw new Error(body.message || 'Сервер ответил ошибкой');
        }
        return body;
    });
}

// ─── Кэш данных ─────────────────────────────────────────────

var cachedHero = { title: '', stats: [] };
var cachedContactForm = { title: '', description: '', submitLabel: '' };
var cachedPositions = [];
var cachedTeam = [];
var cachedVacancies = [];
var cachedBenefits = [];
var cachedGallery = [];
var cachedTimeline = [];
var cachedBrands = [];
var cachedWork = [];
var cachedDirections = [];

function loadData() {
    fetch('/api/data', { credentials: 'same-origin' })
        .then(function (response) {
            if (response.status === 401) {
                window.location.href = '/admin/login/';
                throw new Error('Требуется авторизация');
            }
            if (!response.ok) {
                throw new Error('Не удалось загрузить данные');
            }
            return response.json();
        })
        .then(function (data) {
            cachedHero = data.hero || { title: '', stats: [] };
            cachedContactForm = data.contactForm || { title: '', description: '', submitLabel: '' };
            cachedPositions = data.positions || [];
            cachedTeam = data.team || [];
            cachedVacancies = data.vacancies || [];
            cachedBenefits = data.benefits || [];
            cachedGallery = data.gallery || [];
            cachedTimeline = data.timeline || [];
            cachedBrands = data.brands || [];
            cachedWork = data.work || [];
            cachedDirections = data.directions || [];

            renderHeroForm(cachedHero);
            renderContactForm(cachedContactForm);
            renderAllBlocks();
            updateStatCards(data);
            isDirty = false;
        })
        .catch(function (error) {
            showStatus('Ошибка загрузки: ' + error.message, 'error');
        });
}

function renderAllBlocks() {
    for (var name in blockConfigs) {
        renderBlock(name);
    }
}

// ─── Навигация ──────────────────────────────────────────────

var isDirty = false;

var sectionLabels = {
    hero: 'О нас',
    team: 'Сотрудники',
    positions: 'Должности',
    timeline: 'Таймлайн платформы',
    brands: 'Партнёры',
    directions: 'Направления',
    vacancies: 'Вакансии',
    gallery: 'Фотогалерея',
    work: 'Офисы',
    benefits: 'Плюшки',
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

// Отмечаем «есть несохранённые изменения» при вводе в Hero и контактной форме.
// Таблицы read-only, а редактирование карточек идёт через модалку —
// там свои кнопки Сохранить/Отмена. Поля поиска тоже не считаются.
function wireDirtyTracking() {
    document.body.addEventListener('input', function (event) {
        var target = event.target;
        if (target.closest && target.closest('#modal-overlay')) return;
        if (target.classList && target.classList.contains('search-input')) return;
        if (target.matches('input, textarea, select')) {
            isDirty = true;
        }
    });
}

// ─── Отмена действий (undo) ─────────────────────────────────
// Перед каждым изменением через API запоминаем обратную операцию:
//   изменение  → PUT со старыми значениями
//   добавление → DELETE созданной записи
//   удаление   → POST с прежними полями (id будет новый — это ограничение
//                REST-API: сервер сам выдаёт id при создании)
// Кнопка «Отменить» в блоке откатывает последнее действие этого блока,
// Ctrl+Z — последнее действие где угодно.

var undoStack = [];

function pushUndo(block, label, undoFn) {
    undoStack.push({ block: block, label: label, undo: undoFn });
    if (undoStack.length > 30) {
        undoStack.shift();
    }
}

function runUndo(entry) {
    entry.undo()
        .then(function () {
            showStatus('Отменено: ' + entry.label);
            loadData();
        })
        .catch(function (error) {
            showStatus('Не удалось отменить: ' + error.message, 'error');
        });
}

function performBlockUndo(block) {
    for (var i = undoStack.length - 1; i >= 0; i--) {
        if (undoStack[i].block === block) {
            var entry = undoStack.splice(i, 1)[0];
            runUndo(entry);
            return;
        }
    }
    showStatus('Нет действий для отмены в этом блоке');
}

function performGlobalUndo() {
    if (undoStack.length === 0) {
        showStatus('Нет действий для отмены');
        return;
    }
    runUndo(undoStack.pop());
}

function wireUndo() {
    for (var name in blockConfigs) {
        wireUndoButton(name);
    }
    wireUndoButton('hero');
    wireUndoButton('contact-form');

    document.addEventListener('keydown', function (event) {
        var isUndoKey = (event.ctrlKey || event.metaKey) &&
            (event.key === 'z' || event.key === 'Z' || event.key === 'я' || event.key === 'Я');
        if (!isUndoKey) return;
        var t = event.target;
        if (t && t.matches && t.matches('input, textarea, select')) return;
        event.preventDefault();
        performGlobalUndo();
    });
}

function wireUndoButton(block) {
    var btn = document.querySelector('#' + block + '-undo');
    if (btn) {
        btn.addEventListener('click', function () {
            performBlockUndo(block);
        });
    }
}

// ─── Hero (форма-одиночка, редактируется на месте) ──────────

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

    var previous = cachedHero;

    apiRequest('PUT', '/api/hero', data)
        .then(parseApiResponse)
        .then(function () {
            pushUndo('hero', 'изменение блока «О нас»', function () {
                return apiRequest('PUT', '/api/hero', previous).then(parseApiResponse);
            });
            showStatus('Сохранено');
            isDirty = false;
            loadData();
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

// ─── Хелперы для форм ───────────────────────────────────────

function buildField(labelText, extraClasses, value, dataSocial) {
    var fragment = document.createDocumentFragment();

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input' + (extraClasses ? ' ' + extraClasses : '');
    input.value = value == null ? '' : value;
    if (dataSocial) {
        input.dataset.social = dataSocial;
    }

    fragment.appendChild(label);
    fragment.appendChild(input);
    return fragment;
}

function buildTextareaField(labelText, extraClasses, value, rows) {
    var fragment = document.createDocumentFragment();

    var label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = labelText;

    var area = document.createElement('textarea');
    area.className = 'field-input' + (extraClasses ? ' ' + extraClasses : '');
    area.rows = rows || 3;
    area.value = value == null ? '' : value;

    fragment.appendChild(label);
    fragment.appendChild(area);
    return fragment;
}

// Text field + "Загрузить..." button. Selecting a local file POSTs it to
// /api/upload (multer сохраняет в travelline_site/upload/user-uploads/),
// сервер отвечает относительным путём, который мы подставляем в input.
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
    fileInput.style.display = 'none';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small';
    button.textContent = 'Загрузить...';
    button.addEventListener('click', function () { fileInput.click(); });

    fileInput.addEventListener('change', function (event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;
        uploadFile(file, function (err, src) {
            if (err) { showStatus('Ошибка загрузки: ' + err.message, 'error'); return; }
            input.value = src;
            showStatus('Файл загружен: ' + file.name);
        });
        fileInput.value = '';
    });

    row.appendChild(button);
    row.appendChild(fileInput);
    fragment.appendChild(row);
    return fragment;
}

function uploadFile(file, callback) {
    var form = new FormData();
    form.append('file', file);
    fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (result) {
            if (result.ok && result.body && result.body.success && result.body.data && result.body.data.src) {
                callback(null, result.body.data.src);
            } else {
                var msg = result.body && result.body.message ? result.body.message : 'неизвестная ошибка';
                callback(new Error(msg));
            }
        })
        .catch(function (err) { callback(err); });
}

// Quick-replace: клик по картинке в таблице открывает системный file picker,
// после выбора файла он загружается на сервер и подставляется в поле
// (например photo/src/image) записи. Используется для TZ «клик по фото → путь к фото».
function attachQuickReplace(img, cfgName, item, field) {
    img.classList.add('table-thumb--clickable');
    img.title = 'Нажмите, чтобы заменить файл';
    img.addEventListener('click', function () {
        var cfg = blockConfigs[cfgName];
        var picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*,video/*';
        picker.style.display = 'none';
        document.body.appendChild(picker);
        picker.addEventListener('change', function () {
            var file = picker.files && picker.files[0];
            document.body.removeChild(picker);
            if (!file) return;
            uploadFile(file, function (err, src) {
                if (err) { showStatus('Ошибка загрузки: ' + err.message, 'error'); return; }
                var payload = cfg.toPayload(item);
                payload[field] = src;
                if (cfg.hasActive !== false) payload.active = item.active !== false;
                apiRequest('PUT', cfg.api + '/' + item.id, payload)
                    .then(parseApiResponse)
                    .then(function () {
                        showStatus('Файл заменён');
                        loadData();
                    })
                    .catch(function (e) { showStatus('Ошибка сохранения: ' + e.message, 'error'); });
            });
        });
        picker.click();
    });
    return img;
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

    // Если текущее значение не входит в список (например, должность удалили),
    // не теряем его молча, а показываем отдельным пунктом.
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

function buildActiveBadge(active) {
    var badge = document.createElement('span');
    var isActive = active !== false;
    badge.className = 'badge ' + (isActive ? 'badge-active' : 'badge-inactive');
    badge.textContent = isActive ? 'Активен' : 'Неактивен';
    return badge;
}

// ─── Модальное окно ─────────────────────────────────────────
// Одно на всю админку: openModal подставляет заголовок, содержимое
// и обработчик кнопки «Сохранить». Закрытие — крестик, «Отмена»,
// клик по подложке или Esc.

var modalSaveHandler = null;

function openModal(title, bodyEl, onSave) {
    document.querySelector('#modal-title').textContent = title;
    var body = document.querySelector('#modal-body');
    body.innerHTML = '';
    body.appendChild(bodyEl);
    modalSaveHandler = onSave;
    document.querySelector('#modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.querySelector('#modal-overlay').style.display = 'none';
    document.querySelector('#modal-body').innerHTML = '';
    modalSaveHandler = null;
}

function wireModal() {
    document.querySelector('#modal-save').addEventListener('click', function () {
        if (modalSaveHandler) modalSaveHandler();
    });
    document.querySelector('#modal-cancel').addEventListener('click', closeModal);
    document.querySelector('#modal-close').addEventListener('click', closeModal);
    document.querySelector('#modal-overlay').addEventListener('click', function (event) {
        if (event.target === this) closeModal();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && document.querySelector('#modal-overlay').style.display !== 'none') {
            closeModal();
        }
    });
}

// ─── Хелперы для таблиц ─────────────────────────────────────

function textCell(text) {
    var span = document.createElement('span');
    span.textContent = text == null ? '' : text;
    return span;
}

function truncCell(text) {
    var span = document.createElement('span');
    span.className = 'cell-truncate';
    span.textContent = text == null ? '' : text;
    span.title = text == null ? '' : text;
    return span;
}

function imgCell(src, alt, isLogo) {
    var img = document.createElement('img');
    img.className = 'table-thumb' + (isLogo ? ' table-thumb--logo' : '');
    img.src = resolveSitePath(src || 'upload/placeholder-avatar.svg');
    img.alt = alt || '';
    return img;
}

function linkCell(url) {
    var a = document.createElement('a');
    a.href = url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'cell-truncate table-link';
    a.textContent = url || '';
    a.title = url || '';
    return a;
}

function buildIconButton(symbol, titleText, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn icon';
    btn.textContent = symbol;
    btn.title = titleText;
    btn.addEventListener('click', onClick);
    return btn;
}

// Кнопки-действия строки: редактировать / (де)активировать / удалить.
function buildRowActions(name, item) {
    var cfg = blockConfigs[name];
    var box = document.createElement('div');
    box.className = 'table-actions';

    box.appendChild(buildIconButton('✏️', 'Редактировать', function () {
        openBlockEditModal(name, item.id);
    }));

    if (cfg.hasActive !== false) {
        var isActive = item.active !== false;
        box.appendChild(buildIconButton(
            isActive ? '🚫' : '✅',
            isActive ? 'Деактивировать (скрыть на сайте)' : 'Активировать (показать на сайте)',
            function () { toggleBlockItemActive(name, item.id); }
        ));
    }

    box.appendChild(buildIconButton('🗑️', 'Удалить', function () {
        deleteBlockItem(name, item.id);
    }));

    return box;
}

// ─── Поиск и сортировка ─────────────────────────────────────
// Поиск: у каждого блока есть поле #<имя>-search, фильтрация идёт
// по полям из cfg.searchFields (без запроса к серверу, по кэшу).
// Сортировка: клик по заголовку сортируемой колонки (▲/▼).

function getBlockItems(name) {
    var cfg = blockConfigs[name];
    var items = cfg.getCache();
    var input = document.querySelector('#' + name + '-search');
    if (input && input.value.trim() !== '') {
        var q = input.value.trim().toLowerCase();
        items = items.filter(function (item) {
            for (var i = 0; i < cfg.searchFields.length; i++) {
                var value = item[cfg.searchFields[i]];
                if (value != null && String(value).toLowerCase().indexOf(q) !== -1) {
                    return true;
                }
            }
            return false;
        });
    }
    return items;
}

var sortState = {
    timeline: { col: 1, dir: 1 }
};

function getSortedItems(name) {
    var cfg = blockConfigs[name];
    var items = getBlockItems(name);
    var st = sortState[name];
    if (st) {
        var col = cfg.columns[st.col];
        if (col && col.sortValue) {
            items = items.slice().sort(function (a, b) {
                var va = col.sortValue(a);
                var vb = col.sortValue(b);
                if (typeof va === 'number' && typeof vb === 'number') {
                    return (va - vb) * st.dir;
                }
                return String(va).toLowerCase().localeCompare(String(vb).toLowerCase(), 'ru') * st.dir;
            });
        }
    }
    return items;
}

function buildHeaderCell(name, col, idx) {
    var th = document.createElement('th');
    var st = sortState[name];
    var arrow = (st && st.col === idx) ? (st.dir === 1 ? ' ▲' : ' ▼') : '';
    th.textContent = col.label + arrow;
    if (col.sortValue) {
        th.className = 'sortable';
        th.title = 'Сортировать';
        th.addEventListener('click', function () {
            var cur = sortState[name];
            if (cur && cur.col === idx) {
                sortState[name] = { col: idx, dir: -cur.dir };
            } else {
                sortState[name] = { col: idx, dir: 1 };
            }
            renderBlock(name);
        });
    }
    return th;
}

// ─── Универсальный движок таблиц ────────────────────────────
// Все блоки-списки рендерятся одной функцией по конфигу blockConfigs:
// колонки, поля формы, адрес API и валидация у каждого свои,
// а таблица, модалка, сортировка, поиск и кнопки — общие.

function renderBlock(name) {
    var cfg = blockConfigs[name];
    var wrap = document.querySelector('#' + name + '-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    wrap.appendChild(buildBlockTable(name));
}

function buildBlockTable(name) {
    var cfg = blockConfigs[name];
    var items = getSortedItems(name);

    var table = document.createElement('table');
    table.className = 'data-table' + (cfg.narrow ? ' data-table--narrow' : '');

    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    for (var c = 0; c < cfg.columns.length; c++) {
        headRow.appendChild(buildHeaderCell(name, cfg.columns[c], c));
    }
    if (cfg.hasActive !== false) {
        var thStatus = document.createElement('th');
        thStatus.textContent = 'Статус';
        headRow.appendChild(thStatus);
    }
    var thActions = document.createElement('th');
    thActions.textContent = 'Действия';
    headRow.appendChild(thActions);
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');

    if (items.length === 0) {
        var emptyRow = document.createElement('tr');
        var emptyCell = document.createElement('td');
        emptyCell.colSpan = cfg.columns.length + (cfg.hasActive !== false ? 2 : 1);
        emptyCell.className = 'table-empty';
        emptyCell.textContent = 'Нет записей';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    }

    for (var i = 0; i < items.length; i++) {
        tbody.appendChild(buildBodyRow(name, cfg, items[i]));
    }
    table.appendChild(tbody);
    return table;
}

function buildBodyRow(name, cfg, item) {
    var tr = document.createElement('tr');
    if (item.active === false) tr.classList.add('row-inactive');

    for (var c = 0; c < cfg.columns.length; c++) {
        var td = document.createElement('td');
        td.appendChild(cfg.columns[c].render(item));
        tr.appendChild(td);
    }

    if (cfg.hasActive !== false) {
        var tdStatus = document.createElement('td');
        tdStatus.appendChild(buildActiveBadge(item.active));
        tr.appendChild(tdStatus);
    }

    var tdActions = document.createElement('td');
    tdActions.appendChild(buildRowActions(name, item));
    tr.appendChild(tdActions);

    return tr;
}

// Открывает модалку редактирования (id задан) или добавления (id === null).
function openBlockEditModal(name, id) {
    var cfg = blockConfigs[name];
    var isNew = (id === null || id === undefined);
    var item = isNew ? cfg.defaults() : findById(cfg.getCache(), id);
    if (!item) return;

    var form = cfg.buildForm(item);

    // Старые значения для отмены (до изменения).
    var oldPayload = null;
    if (!isNew) {
        oldPayload = cfg.toPayload(item);
        if (cfg.hasActive !== false) {
            oldPayload.active = item.active !== false;
        }
    }

    openModal(isNew ? cfg.addTitle : cfg.editTitle, form, function () {
        var data = cfg.collect(form);
        var error = cfg.validate(data);
        if (error) {
            showStatus(error, 'error');
            return;
        }
        if (cfg.hasActive !== false) {
            data.active = isNew ? true : (item.active !== false);
        }

        var request = isNew
            ? apiRequest('POST', cfg.api, data)
            : apiRequest('PUT', cfg.api + '/' + id, data);

        request
            .then(parseApiResponse)
            .then(function (body) {
                if (isNew) {
                    var createdId = body.data.id;
                    pushUndo(name, 'добавление записи', function () {
                        return apiRequest('DELETE', cfg.api + '/' + createdId).then(parseApiResponse);
                    });
                } else {
                    pushUndo(name, 'изменение записи', function () {
                        return apiRequest('PUT', cfg.api + '/' + id, oldPayload).then(parseApiResponse);
                    });
                }
                showStatus(isNew ? 'Добавлено' : 'Сохранено');
                closeModal();
                isDirty = false;
                loadData();
            })
            .catch(function (err) {
                showStatus('Ошибка сохранения: ' + err.message, 'error');
            });
    });
}

function toggleBlockItemActive(name, id) {
    var cfg = blockConfigs[name];
    var item = findById(cfg.getCache(), id);
    if (!item) return;

    var oldPayload = cfg.toPayload(item);
    oldPayload.active = item.active !== false;

    var payload = cfg.toPayload(item);
    payload.active = (item.active === false); // переворачиваем состояние

    apiRequest('PUT', cfg.api + '/' + id, payload)
        .then(parseApiResponse)
        .then(function () {
            pushUndo(name, 'смену статуса', function () {
                return apiRequest('PUT', cfg.api + '/' + id, oldPayload).then(parseApiResponse);
            });
            showStatus(payload.active ? 'Запись активирована' : 'Запись деактивирована');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка: ' + error.message, 'error');
        });
}

function deleteBlockItem(name, id) {
    var cfg = blockConfigs[name];
    var item = findById(cfg.getCache(), id);
    if (!item) return;

    if (!confirm(cfg.deleteConfirm + ' Вернуть можно будет кнопкой «Отменить».')) {
        return;
    }

    var snapshot = cfg.toPayload(item);
    if (cfg.hasActive !== false) {
        snapshot.active = item.active !== false;
    }

    apiRequest('DELETE', cfg.api + '/' + id)
        .then(parseApiResponse)
        .then(function () {
            pushUndo(name, 'удаление записи', function () {
                return apiRequest('POST', cfg.api, snapshot).then(parseApiResponse);
            });
            showStatus('Удалено');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка удаления: ' + error.message, 'error');
        });
}

// ─── Должности: выпадающий список и inline-добавление ───────

function buildPositionOptions() {
    var opts = [];
    for (var i = 0; i < cachedPositions.length; i++) {
        if (cachedPositions[i].active === false) continue;
        opts.push(cachedPositions[i].title);
    }
    return opts;
}

function buildInlinePositionAdd(form) {
    var wrap = document.createElement('div');
    wrap.className = 'inline-add';
    wrap.style.display = 'none';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'field-input';
    input.placeholder = 'Новая должность...';
    wrap.appendChild(input);

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
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
                pushUndo('positions', 'добавление должности', function () {
                    return apiRequest('DELETE', '/api/positions/' + body.data.id).then(parseApiResponse);
                });
                var select = form.querySelector('.team__item-description');
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

// ─── Направления: строка «технология» (название + иконка) ───

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
    del.type = 'button';
    del.className = 'btn danger small';
    del.textContent = 'Удалить';
    del.addEventListener('click', function () {
        row.remove();
    });
    row.appendChild(del);

    return row;
}

// ─── Метки таймлайна ────────────────────────────────────────
// SVG-файлы лежат в upload/marks (о них писал Егор — публичная
// страница показывает метку у каждой карточки таймлайна).
// ВНИМАНИЕ: серверный контракт Никиты пока НЕ сохраняет поле mark
// при добавлении/изменении — метки отображаются из data.json, а чтобы
// они редактировались из админки, Никите нужно добавить mark в
// validateTimelineItem/addTimelineItem/updateTimelineItem.

// 19 вариантов цвета иконки таймлайна — соответствуют CSS-классу
// .icon-block--N в travelline_site/.../style.min.css. value идёт в поле
// item.type; hex здесь — для превью в палитре (те варианты, где явного цвета
// в исходном CSS нет, фолбечатся на базовый #507bce).
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
    { value: '19', color: '#227bdd', label: 'Синий 19' }
];

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
    hidden.value = String(currentValue == null ? '1' : currentValue);
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

var TIMELINE_MARKS = [
    'upload/marks/billing.svg', 'upload/marks/binoculars.svg', 'upload/marks/booking.svg',
    'upload/marks/channel-manager.svg', 'upload/marks/crm-integration.svg', 'upload/marks/express.svg',
    'upload/marks/flower.svg', 'upload/marks/gms.svg', 'upload/marks/mobile-extranet.svg',
    'upload/marks/order-management.svg', 'upload/marks/partner-api.svg', 'upload/marks/price-optimizer.svg',
    'upload/marks/reactor.svg', 'upload/marks/reputation.svg', 'upload/marks/rocket.svg', 'upload/marks/star.svg'
];

// ─── Конфиги блоков ─────────────────────────────────────────
// Каждый блок-список описывается конфигом; движок выше делает всё
// остальное. Поля конфига:
//   api          — базовый адрес REST-ресурса
//   getCache     — актуальный массив из кэша
//   searchFields — по каким полям ищет строка поиска
//   columns      — колонки таблицы: label, render(item), sortValue(item)
//   buildForm    — собирает форму для модалки
//   collect      — читает данные из формы
//   validate     — возвращает текст ошибки или null
//   defaults     — заготовка новой записи
//   toPayload    — тело PUT/POST из кэшированной записи (для undo и active)
//   hasActive    — false, если у сущности нет поля active (должности)
//   narrow       — true, если таблицу не нужно растягивать на всю ширину

var blockConfigs = {

    team: {
        api: '/api/team',
        addTitle: 'Новый сотрудник',
        editTitle: 'Редактирование сотрудника',
        deleteConfirm: 'Удалить сотрудника?',
        searchFields: ['name', 'position'],
        getCache: function () { return cachedTeam; },
        columns: [
            { label: 'Фото', render: function (m) { return attachQuickReplace(imgCell(m.photo, m.name), 'team', m, 'photo'); } },
            { label: 'Имя', sortValue: function (m) { return m.name || ''; }, render: function (m) { return textCell(m.name); } },
            { label: 'Должность', sortValue: function (m) { return m.position || ''; }, render: function (m) { return textCell(m.position); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Имя', 'team__item-title', item.name));
            form.appendChild(buildSelectField('Должность', 'team__item-description', item.position, buildPositionOptions()));

            var addPosBtn = document.createElement('button');
            addPosBtn.type = 'button';
            addPosBtn.className = 'btn small';
            addPosBtn.textContent = '+ Новая должность';
            addPosBtn.style.marginTop = '6px';
            var inlineAdd = buildInlinePositionAdd(form);
            addPosBtn.addEventListener('click', function () {
                inlineAdd.style.display = inlineAdd.style.display === 'none' ? 'flex' : 'none';
            });
            form.appendChild(addPosBtn);
            form.appendChild(inlineAdd);

            form.appendChild(buildFileUploadField('Фото (путь)', 'team__item-image', item.photo, 'image/*'));
            form.appendChild(buildField('VK', '', item.vk, 'vk'));
            return form;
        },
        collect: function (form) {
            return {
                name: form.querySelector('.team__item-title').value,
                position: form.querySelector('.team__item-description').value,
                photo: form.querySelector('.team__item-image').value,
                vk: form.querySelector('[data-social="vk"]').value
            };
        },
        validate: function (data) {
            if (data.name.trim() === '' || data.position.trim() === '' || data.photo.trim() === '') {
                return 'Заполните имя, должность и фото сотрудника';
            }
            return null;
        },
        defaults: function () {
            return {
                name: '',
                position: cachedPositions.length > 0 ? cachedPositions[0].title : '',
                photo: 'upload/placeholder-avatar.svg',
                vk: '#'
            };
        },
        toPayload: function (m) {
            return { name: m.name, position: m.position, photo: m.photo, vk: m.vk };
        }
    },

    positions: {
        api: '/api/positions',
        narrow: true,
        addTitle: 'Новая должность',
        editTitle: 'Редактирование должности',
        deleteConfirm: 'Удалить должность?',
        searchFields: ['title'],
        getCache: function () { return cachedPositions; },
        columns: [
            { label: 'Название', sortValue: function (p) { return p.title || ''; }, render: function (p) { return textCell(p.title); } },
            {
                label: 'Сотрудников',
                sortValue: function (p) {
                    return cachedTeam.filter(function (m) { return m.position === p.title; }).length;
                },
                render: function (p) {
                    var count = cachedTeam.filter(function (m) { return m.position === p.title; }).length;
                    return textCell(count);
                }
            }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Название должности', 'position-title', item.title));
            return form;
        },
        collect: function (form) {
            return { title: form.querySelector('.position-title').value };
        },
        validate: function (data) {
            if (data.title.trim() === '') return 'Введите название должности';
            return null;
        },
        defaults: function () { return { title: '' }; },
        toPayload: function (p) { return { title: p.title }; }
    },

    timeline: {
        api: '/api/timeline',
        addTitle: 'Новый продукт таймлайна',
        editTitle: 'Редактирование продукта',
        deleteConfirm: 'Удалить карточку таймлайна?',
        searchFields: ['title', 'strategy', 'subtitle', 'text', 'year'],
        getCache: function () { return cachedTimeline; },
        columns: [
            { label: 'Метка', render: function (t) { return attachQuickReplace(imgCell(t.mark || 'upload/marks/star.svg', t.title, true), 'timeline', t, 'mark'); } },
            { label: 'Год', sortValue: function (t) { return t.year || 0; }, render: function (t) { return textCell(t.year); } },
            { label: 'Название', sortValue: function (t) { return t.title || ''; }, render: function (t) { return textCell(t.title); } },
            { label: 'Категория', sortValue: function (t) { return t.strategy || ''; }, render: function (t) { return textCell(t.strategy); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Год', 'timeline__item-year', item.year));
            form.appendChild(buildField('Название продукта', 'timeline__item-name', item.title));
            form.appendChild(buildSelectField('Тип метки (аудитория)', 'timeline__item-category', item.strategy, ['B2B', 'B2C', 'B2E']));
            form.appendChild(buildSelectField('Метка (иконка из upload/marks)', 'timeline__item-mark', item.mark, TIMELINE_MARKS));
            form.appendChild(buildTimelineColorField(item.type || '1'));
            form.appendChild(buildField('Подзаголовок', 'timeline__item-subtitle', item.subtitle));
            form.appendChild(buildTextareaField('Описание', 'timeline__item-description', item.text, 3));
            return form;
        },
        collect: function (form) {
            return {
                year: Number(form.querySelector('.timeline__item-year').value),
                title: form.querySelector('.timeline__item-name').value,
                strategy: form.querySelector('.timeline__item-category').value,
                mark: form.querySelector('.timeline__item-mark').value,
                type: String(form.querySelector('.timeline__item-type').value || '1'),
                subtitle: form.querySelector('.timeline__item-subtitle').value,
                text: form.querySelector('.timeline__item-description').value
            };
        },
        validate: function (data) {
            if (!Number.isInteger(data.year) || data.year < 1990 || data.year > 2100) {
                return 'Год должен быть целым числом от 1990 до 2100';
            }
            if (data.title.trim() === '' || data.subtitle.trim() === '' || data.text.trim() === '') {
                return 'Заполните название, подзаголовок и описание';
            }
            if (!data.type || String(data.type).trim() === '') {
                return 'Заполните вариант оформления (номер 1-19)';
            }
            return null;
        },
        defaults: function () {
            return { year: new Date().getFullYear(), title: '', strategy: 'B2B', mark: TIMELINE_MARKS[0], type: '1', subtitle: '', text: '' };
        },
        toPayload: function (t) {
            return { year: t.year, title: t.title, strategy: t.strategy, mark: t.mark, type: t.type || '1', subtitle: t.subtitle, text: t.text };
        }
    },

    brands: {
        api: '/api/brands',
        narrow: true,
        addTitle: 'Новый логотип',
        editTitle: 'Редактирование логотипа',
        deleteConfirm: 'Удалить логотип?',
        searchFields: ['name', 'src'],
        getCache: function () { return cachedBrands; },
        columns: [
            { label: 'Логотип', render: function (b) { return attachQuickReplace(imgCell(b.src, b.name, true), 'brands', b, 'src'); } },
            { label: 'Название', sortValue: function (b) { return b.name || ''; }, render: function (b) { return textCell(b.name); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildFileUploadField('Путь к логотипу', 'brands__item-src', item.src, 'image/*'));
            form.appendChild(buildField('Название компании', 'brands__item-name', item.name));
            return form;
        },
        collect: function (form) {
            return {
                src: form.querySelector('.brands__item-src').value,
                name: form.querySelector('.brands__item-name').value
            };
        },
        validate: function (data) {
            if (data.src.trim() === '' || data.name.trim() === '') {
                return 'Заполните путь к логотипу и название';
            }
            return null;
        },
        defaults: function () { return { src: '', name: '' }; },
        toPayload: function (b) { return { src: b.src, name: b.name }; }
    },

    directions: {
        api: '/api/directions',
        addTitle: 'Новое направление',
        editTitle: 'Редактирование направления',
        deleteConfirm: 'Удалить направление?',
        searchFields: ['title', 'description'],
        getCache: function () { return cachedDirections; },
        columns: [
            { label: 'Название', sortValue: function (d) { return d.title || ''; }, render: function (d) { return textCell(d.title); } },
            {
                label: 'Технологий',
                sortValue: function (d) { return (d.technologies || []).length; },
                render: function (d) { return textCell((d.technologies || []).length); }
            },
            { label: 'Описание', render: function (d) { return truncCell(d.description); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Название направления', 'directions__item-title', item.title));
            form.appendChild(buildTextareaField('Описание', 'directions__item-description', item.description, 3));

            var techLabel = document.createElement('h4');
            techLabel.className = 'subsection-title';
            techLabel.textContent = 'Технологии';
            form.appendChild(techLabel);

            var techList = document.createElement('div');
            techList.className = 'stats-list direction-technologies';
            var technologies = item.technologies || [];
            for (var i = 0; i < technologies.length; i++) {
                techList.appendChild(buildTechnologyRow(technologies[i]));
            }
            form.appendChild(techList);

            var addTechBtn = document.createElement('button');
            addTechBtn.type = 'button';
            addTechBtn.className = 'btn small';
            addTechBtn.textContent = '+ Добавить технологию';
            addTechBtn.addEventListener('click', function () {
                var row = buildTechnologyRow({ name: '', icon: '' });
                techList.appendChild(row);
                row.querySelector('.tech-name').focus();
            });
            form.appendChild(addTechBtn);

            return form;
        },
        collect: function (form) {
            var technologies = [];
            var rows = form.querySelectorAll('.direction-technologies .stats-row');
            for (var i = 0; i < rows.length; i++) {
                technologies.push({
                    name: rows[i].querySelector('.tech-name').value,
                    icon: rows[i].querySelector('.tech-icon').value
                });
            }
            return {
                title: form.querySelector('.directions__item-title').value,
                description: form.querySelector('.directions__item-description').value,
                technologies: technologies
            };
        },
        validate: function (data) {
            if (data.title.trim() === '' || data.description.trim() === '') {
                return 'Заполните название и описание направления';
            }
            for (var i = 0; i < data.technologies.length; i++) {
                if (data.technologies[i].name.trim() === '' || data.technologies[i].icon.trim() === '') {
                    return 'Заполните все поля технологий или удалите пустые строки';
                }
            }
            return null;
        },
        defaults: function () { return { title: '', description: '', technologies: [] }; },
        toPayload: function (d) {
            return { title: d.title, description: d.description, technologies: d.technologies };
        }
    },

    vacancies: {
        api: '/api/vacancies',
        addTitle: 'Новая вакансия',
        editTitle: 'Редактирование вакансии',
        deleteConfirm: 'Удалить вакансию?',
        searchFields: ['title', 'format', 'url'],
        getCache: function () { return cachedVacancies; },
        columns: [
            { label: 'Название', sortValue: function (v) { return v.title || ''; }, render: function (v) { return textCell(v.title); } },
            { label: 'Формат', sortValue: function (v) { return v.format || ''; }, render: function (v) { return textCell(v.format); } },
            { label: 'Ссылка', sortValue: function (v) { return v.url || ''; }, render: function (v) { return linkCell(v.url); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Название', 'vacancies__item-title', item.title));
            form.appendChild(buildField('Формат / город', 'vacancies__item-address', item.format));
            form.appendChild(buildField('Ссылка на hh.ru', 'vacancies__item-lik', item.url));
            return form;
        },
        collect: function (form) {
            return {
                title: form.querySelector('.vacancies__item-title').value,
                format: form.querySelector('.vacancies__item-address').value,
                url: form.querySelector('.vacancies__item-lik').value
            };
        },
        validate: function (data) {
            if (data.title.trim() === '' || data.format.trim() === '' || data.url.trim() === '') {
                return 'Заполните все поля вакансии';
            }
            return null;
        },
        defaults: function () {
            return { title: '', format: 'удаленно', url: 'https://hh.ru' };
        },
        toPayload: function (v) {
            return { title: v.title, format: v.format, url: v.url };
        }
    },

    gallery: {
        api: '/api/gallery',
        addTitle: 'Новое фото',
        editTitle: 'Редактирование фото',
        deleteConfirm: 'Удалить фото?',
        searchFields: ['caption', 'type', 'src'],
        getCache: function () { return cachedGallery; },
        columns: [
            {
                label: 'Превью',
                render: function (g) {
                    if (g.type === 'video') {
                        var v = document.createElement('span');
                        v.className = 'table-video-mark';
                        v.textContent = '🎬';
                        v.title = g.src;
                        return v;
                    }
                    var im = imgCell(g.src, g.caption);
                    im.classList.add('table-thumb--gallery');
                    return attachQuickReplace(im, 'gallery', g, 'src');
                }
            },
            { label: 'Тип', sortValue: function (g) { return g.type || ''; }, render: function (g) { return textCell(g.type === 'video' ? 'видео' : 'фото'); } },
            { label: 'Подпись', sortValue: function (g) { return g.caption || ''; }, render: function (g) { return truncCell(g.caption); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildFileUploadField('Путь к файлу', 'gallery__item-src', item.src));
            form.appendChild(buildSelectField('Тип файла', 'gallery__item-type', item.type, ['image', 'video']));
            form.appendChild(buildField('Подпись к фото', 'gallery__item-caption', item.caption));
            return form;
        },
        collect: function (form) {
            return {
                src: form.querySelector('.gallery__item-src').value,
                type: form.querySelector('.gallery__item-type').value,
                caption: form.querySelector('.gallery__item-caption').value
            };
        },
        validate: function (data) {
            if (data.src.trim() === '' || data.caption.trim() === '') {
                return 'Заполните путь к файлу и подпись';
            }
            return null;
        },
        defaults: function () { return { src: '', type: 'image', caption: '' }; },
        toPayload: function (g) { return { src: g.src, type: g.type, caption: g.caption }; }
    },

    work: {
        api: '/api/work',
        addTitle: 'Новое фото офиса',
        editTitle: 'Редактирование фото офиса',
        deleteConfirm: 'Удалить фото офиса?',
        searchFields: ['caption', 'image'],
        getCache: function () { return cachedWork; },
        columns: [
            { label: 'Фото', render: function (w) { return attachQuickReplace(imgCell(w.image, w.caption), 'work', w, 'image'); } },
            { label: 'Подпись', sortValue: function (w) { return w.caption || ''; }, render: function (w) { return truncCell(w.caption); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildFileUploadField('Путь к фото', 'work__item-image', item.image, 'image/*'));
            form.appendChild(buildTextareaField('Подпись', 'work__item-caption', item.caption, 2));
            return form;
        },
        collect: function (form) {
            return {
                image: form.querySelector('.work__item-image').value,
                caption: form.querySelector('.work__item-caption').value
            };
        },
        validate: function (data) {
            if (data.image.trim() === '' || data.caption.trim() === '') {
                return 'Заполните путь к фото и подпись';
            }
            return null;
        },
        defaults: function () { return { image: '', caption: '' }; },
        toPayload: function (w) { return { image: w.image, caption: w.caption }; }
    },

    benefits: {
        api: '/api/benefits',
        addTitle: 'Новый бонус',
        editTitle: 'Редактирование бонуса',
        deleteConfirm: 'Удалить бонус?',
        searchFields: ['title', 'description'],
        getCache: function () { return cachedBenefits; },
        columns: [
            { label: 'Название', sortValue: function (b) { return b.title || ''; }, render: function (b) { return textCell(b.title); } },
            { label: 'Описание', sortValue: function (b) { return b.description || ''; }, render: function (b) { return truncCell(b.description); } }
        ],
        buildForm: function (item) {
            var form = document.createElement('div');
            form.appendChild(buildField('Название', 'bonus__item-title', item.title));
            form.appendChild(buildTextareaField('Описание', 'bonus__item-text', item.description, 3));
            return form;
        },
        collect: function (form) {
            return {
                title: form.querySelector('.bonus__item-title').value,
                description: form.querySelector('.bonus__item-text').value
            };
        },
        validate: function (data) {
            if (data.title.trim() === '' || data.description.trim() === '') {
                return 'Заполните название и описание бонуса';
            }
            return null;
        },
        defaults: function () { return { title: '', description: '' }; },
        toPayload: function (b) { return { title: b.title, description: b.description }; }
    }
};

// ─── Массовое удаление галереи ──────────────────────────────
// Последовательные DELETE-запросы (не параллельно, чтобы не было
// гонки записи в один и тот же data.json). Отмена возвращает все
// фото обратно (id будут новые).

function deleteAllGalleryItems() {
    if (cachedGallery.length === 0) {
        showStatus('Галерея уже пуста');
        return;
    }
    if (!confirm('Удалить все фото галереи (' + cachedGallery.length + ' шт.)? Вернуть можно будет кнопкой «Отменить».')) {
        return;
    }

    var snapshot = cachedGallery.map(function (g) {
        return { src: g.src, type: g.type, caption: g.caption, active: g.active !== false };
    });
    var ids = cachedGallery.map(function (item) { return item.id; });

    var chain = Promise.resolve();
    ids.forEach(function (id) {
        chain = chain.then(function () {
            return apiRequest('DELETE', '/api/gallery/' + id).then(parseApiResponse);
        });
    });

    chain
        .then(function () {
            pushUndo('gallery', 'удаление всей галереи', function () {
                var restore = Promise.resolve();
                snapshot.forEach(function (itemData) {
                    restore = restore.then(function () {
                        return apiRequest('POST', '/api/gallery', itemData).then(parseApiResponse);
                    });
                });
                return restore;
            });
            showStatus('Вся галерея удалена');
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка при массовом удалении: ' + error.message, 'error');
            loadData();
        });
}

// ─── Контактная форма (singleton, редактируется на месте) ───

function renderContactForm(form) {
    document.querySelector('#contact-form-title').value = form.title || '';
    document.querySelector('#contact-form-description').value = form.description || '';
    var submitInput = document.querySelector('#contact-form-submit-label');
    if (submitInput) submitInput.value = form.submitLabel || '';
}

function collectContactFormData() {
    var submitEl = document.querySelector('#contact-form-submit-label');
    return {
        title: document.querySelector('#contact-form-title').value,
        description: document.querySelector('#contact-form-description').value,
        submitLabel: submitEl ? submitEl.value : ''
    };
}

function saveContactForm() {
    var data = collectContactFormData();

    if (data.title.trim() === '' || data.description.trim() === '') {
        showStatus('Заполните заголовок и описание', 'error');
        return;
    }
    if (data.submitLabel.trim() === '') {
        showStatus('Введите текст кнопки отправки', 'error');
        return;
    }

    var previous = cachedContactForm;

    apiRequest('PUT', '/api/contact-form', data)
        .then(parseApiResponse)
        .then(function () {
            pushUndo('contact-form', 'изменение контактной формы', function () {
                return apiRequest('PUT', '/api/contact-form', previous).then(parseApiResponse);
            });
            showStatus('Контактная форма сохранена');
            isDirty = false;
            loadData();
        })
        .catch(function (error) {
            showStatus('Ошибка сохранения: ' + error.message, 'error');
        });
}

// ─── Утилиты ────────────────────────────────────────────────

// Пути к фото в data.json относительные ("upload/...") и рассчитаны
// на публичную страницу, открытую с корня сайта. Админка открыта на
// /admin/, поэтому добавляем ведущий слэш, чтобы путь резолвился от корня.
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

// ─── Привязка кнопок и запуск ───────────────────────────────

function wireStaticButtons() {
    document.querySelector('#hero-add-stat').addEventListener('click', addStat);
    document.querySelector('#hero-save').addEventListener('click', saveHero);

    for (var name in blockConfigs) {
        wireAddButton(name);
    }

    document.querySelector('#gallery-delete-all').addEventListener('click', deleteAllGalleryItems);

    document.querySelector('#contact-form-save').addEventListener('click', saveContactForm);
}

function wireAddButton(name) {
    var btn = document.querySelector('#' + name + '-add');
    if (btn) {
        btn.addEventListener('click', function () {
            openBlockEditModal(name, null);
        });
    }
}

function wireSearch() {
    for (var name in blockConfigs) {
        wireSearchInput(name);
    }
}

function wireSearchInput(name) {
    var input = document.querySelector('#' + name + '-search');
    if (input) {
        input.addEventListener('input', function () {
            renderBlock(name);
        });
    }
}

function wireLogout() {
    var btn = document.querySelector('#logout-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
            .then(function () { window.location.href = '/admin/login/'; })
            .catch(function () { window.location.href = '/admin/login/'; });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    wireStaticButtons();
    wireSidebar();
    wireDirtyTracking();
    wireSearch();
    wireUndo();
    wireModal();
    wireLogout();
    loadData();
});
