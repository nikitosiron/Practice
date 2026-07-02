const { readData, writeData } = require('./storage');

function getNextId(list) {
    if (list.length === 0) return 1;
    return Math.max(...list.map(item => item.id)) + 1;
}

function validationError(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function notFoundError(message) {
    const err = new Error(message);
    err.status = 404;
    return err;
}

async function updateHero(hero) {
    if (!hero || typeof hero !== 'object') {
        throw validationError('Тело запроса должно быть объектом hero');
    }
    if (typeof hero.title !== 'string' || hero.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (!Array.isArray(hero.stats)) {
        throw validationError('Поле stats должно быть массивом');
    }

    const data = await readData();
    data.hero = { title: hero.title, stats: hero.stats };
    await writeData(data);
    return data.hero;
}

function validateTeamMember(member) {
    if (!member || typeof member !== 'object') {
        throw validationError('Тело запроса должно быть объектом сотрудника');
    }
    if (typeof member.name !== 'string' || member.name.trim() === '') {
        throw validationError('Поле name обязательно и должно быть непустой строкой');
    }
    if (typeof member.position !== 'string' || member.position.trim() === '') {
        throw validationError('Поле position обязательно и должно быть непустой строкой');
    }
}

async function addTeamMember(member) {
    validateTeamMember(member);
    const data = await readData();
    const newMember = {
        id: getNextId(data.team),
        name: member.name,
        position: member.position,
        photo: member.photo ?? '',
        vk: member.vk ?? '#',
        active: member.active !== false
    };
    data.team.push(newMember);
    await writeData(data);
    return newMember;
}

async function updateTeamMember(id, member) {
    validateTeamMember(member);
    const data = await readData();
    const index = data.team.findIndex(m => m.id === id);
    if (index === -1) {
        throw notFoundError(`Сотрудник с id=${id} не найден`);
    }
    const updated = {
        ...data.team[index],
        name: member.name,
        position: member.position,
        photo: member.photo ?? data.team[index].photo,
        vk: member.vk ?? data.team[index].vk,
        active: member.active !== false
    };
    data.team[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteTeamMember(id) {
    const data = await readData();
    const index = data.team.findIndex(m => m.id === id);
    if (index === -1) {
        throw notFoundError(`Сотрудник с id=${id} не найден`);
    }
    const [removed] = data.team.splice(index, 1);
    await writeData(data);
    return removed;
}

function validateVacancy(vacancy) {
    if (!vacancy || typeof vacancy !== 'object') {
        throw validationError('Тело запроса должно быть объектом вакансии');
    }
    if (typeof vacancy.title !== 'string' || vacancy.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (typeof vacancy.format !== 'string' || vacancy.format.trim() === '') {
        throw validationError('Поле format обязательно и должно быть непустой строкой');
    }
    if (typeof vacancy.url !== 'string' || vacancy.url.trim() === '') {
        throw validationError('Поле url обязательно и должно быть непустой строкой');
    }
    try {
        new URL(vacancy.url);
    } catch {
        throw validationError('Поле url должно быть корректной ссылкой (например, https://hh.ru/...)');
    }
}

async function addVacancy(vacancy) {
    validateVacancy(vacancy);
    const data = await readData();
    const newVacancy = {
        id: getNextId(data.vacancies),
        title: vacancy.title,
        format: vacancy.format,
        url: vacancy.url,
        active: vacancy.active !== false
    };
    data.vacancies.push(newVacancy);
    await writeData(data);
    return newVacancy;
}

async function updateVacancy(id, vacancy) {
    validateVacancy(vacancy);
    const data = await readData();
    const index = data.vacancies.findIndex(v => v.id === id);
    if (index === -1) {
        throw notFoundError(`Вакансия с id=${id} не найдена`);
    }
    const updated = {
        ...data.vacancies[index],
        title: vacancy.title,
        format: vacancy.format,
        url: vacancy.url,
        active: vacancy.active !== false
    };
    data.vacancies[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteVacancy(id) {
    const data = await readData();
    const index = data.vacancies.findIndex(v => v.id === id);
    if (index === -1) {
        throw notFoundError(`Вакансия с id=${id} не найдена`);
    }
    const [removed] = data.vacancies.splice(index, 1);
    await writeData(data);
    return removed;
}

function validateBenefit(benefit) {
    if (!benefit || typeof benefit !== 'object') {
        throw validationError('Тело запроса должно быть объектом бонуса');
    }
    if (typeof benefit.title !== 'string' || benefit.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (typeof benefit.description !== 'string' || benefit.description.trim() === '') {
        throw validationError('Поле description обязательно и должно быть непустой строкой');
    }
}

async function addBenefit(benefit) {
    validateBenefit(benefit);
    const data = await readData();
    const newBenefit = {
        id: getNextId(data.benefits),
        title: benefit.title,
        description: benefit.description,
        active: benefit.active !== false
    };
    data.benefits.push(newBenefit);
    await writeData(data);
    return newBenefit;
}

async function updateBenefit(id, benefit) {
    validateBenefit(benefit);
    const data = await readData();
    const index = data.benefits.findIndex(b => b.id === id);
    if (index === -1) {
        throw notFoundError(`Бонус с id=${id} не найден`);
    }
    const updated = {
        ...data.benefits[index],
        title: benefit.title,
        description: benefit.description,
        active: benefit.active !== false
    };
    data.benefits[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteBenefit(id) {
    const data = await readData();
    const index = data.benefits.findIndex(b => b.id === id);
    if (index === -1) {
        throw notFoundError(`Бонус с id=${id} не найден`);
    }
    const [removed] = data.benefits.splice(index, 1);
    await writeData(data);
    return removed;
}

const ALLOWED_GALLERY_TYPES = ['image', 'video'];

function validateGalleryItem(item) {
    if (!item || typeof item !== 'object') {
        throw validationError('Тело запроса должно быть объектом карточки галереи');
    }
    if (typeof item.src !== 'string' || item.src.trim() === '') {
        throw validationError('Поле src обязательно и должно быть непустой строкой');
    }
    if (typeof item.caption !== 'string' || item.caption.trim() === '') {
        throw validationError('Поле caption обязательно и должно быть непустой строкой');
    }
    if (typeof item.type !== 'string') {
        throw validationError('Поле type обязательно и должно быть строкой');
    }
    if (!ALLOWED_GALLERY_TYPES.includes(item.type)) {
        throw validationError('Поле type должно быть одним из: image, video');
    }
}

async function addGalleryItem(item) {
    validateGalleryItem(item);
    const data = await readData();
    const newItem = {
        id: getNextId(data.gallery),
        src: item.src,
        type: item.type,
        caption: item.caption,
        active: item.active !== false
    };
    data.gallery.push(newItem);
    await writeData(data);
    return newItem;
}

async function updateGalleryItem(id, item) {
    validateGalleryItem(item);
    const data = await readData();
    const index = data.gallery.findIndex(g => g.id === id);
    if (index === -1) {
        throw notFoundError(`Карточка галереи с id=${id} не найдена`);
    }
    const updated = {
        ...data.gallery[index],
        src: item.src,
        type: item.type,
        caption: item.caption,
        active: item.active !== false
    };
    data.gallery[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteGalleryItem(id) {
    const data = await readData();
    const index = data.gallery.findIndex(g => g.id === id);
    if (index === -1) {
        throw notFoundError(`Карточка галереи с id=${id} не найдена`);
    }
    const [removed] = data.gallery.splice(index, 1);
    await writeData(data);
    return removed;
}

const ALLOWED_TIMELINE_STRATEGIES = ['B2B', 'B2C', 'B2E'];

function validateTimelineItem(item) {
    if (!item || typeof item !== 'object') {
        throw validationError('Тело запроса должно быть объектом записи таймлайна');
    }
    if (typeof item.type !== 'string' || item.type.trim() === '') {
        throw validationError('Поле type обязательно и должно быть непустой строкой');
    }
    if (typeof item.year !== 'number' || !Number.isInteger(item.year)
        || item.year < 1990 || item.year > 2100) {
        throw validationError('Поле year должно быть целым числом от 1990 до 2100');
    }
    if (item.mark !== undefined && typeof item.mark !== 'string') {
        throw validationError('Поле mark, если задано, должно быть строкой');
    }
    if (typeof item.title !== 'string' || item.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (typeof item.subtitle !== 'string' || item.subtitle.trim() === '') {
        throw validationError('Поле subtitle обязательно и должно быть непустой строкой');
    }
    if (typeof item.strategy !== 'string') {
        throw validationError('Поле strategy должно быть строкой');
    }
    if (!ALLOWED_TIMELINE_STRATEGIES.includes(item.strategy)) {
        throw validationError('Поле strategy должно быть одним из: B2B, B2C, B2E');
    }
    if (typeof item.text !== 'string' || item.text.trim() === '') {
        throw validationError('Поле text обязательно и должно быть непустой строкой');
    }
}

async function addTimelineItem(item) {
    validateTimelineItem(item);
    const data = await readData();
    if (!data.timeline) data.timeline = [];
    const newItem = {
        id: getNextId(data.timeline),
        type: item.type,
        year: item.year,
        mark: item.mark ?? '',
        title: item.title,
        subtitle: item.subtitle,
        strategy: item.strategy,
        text: item.text,
        active: item.active !== false
    };
    data.timeline.push(newItem);
    await writeData(data);
    return newItem;
}

async function updateTimelineItem(id, item) {
    validateTimelineItem(item);
    const data = await readData();
    if (!data.timeline) data.timeline = [];
    const index = data.timeline.findIndex(t => t.id === id);
    if (index === -1) {
        throw notFoundError(`Запись таймлайна с id=${id} не найдена`);
    }
    const updated = {
        ...data.timeline[index],
        type: item.type,
        year: item.year,
        mark: item.mark ?? data.timeline[index].mark ?? '',
        title: item.title,
        subtitle: item.subtitle,
        strategy: item.strategy,
        text: item.text,
        active: item.active !== false
    };
    data.timeline[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteTimelineItem(id) {
    const data = await readData();
    if (!data.timeline) data.timeline = [];
    const index = data.timeline.findIndex(t => t.id === id);
    if (index === -1) {
        throw notFoundError(`Запись таймлайна с id=${id} не найдена`);
    }
    const [removed] = data.timeline.splice(index, 1);
    await writeData(data);
    return removed;
}

function validatePosition(position) {
    if (!position || typeof position !== 'object') {
        throw validationError('Тело запроса должно быть объектом должности');
    }
    if (typeof position.title !== 'string' || position.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
}

async function getPositions() {
    const data = await readData();
    return data.positions || [];
}

async function addPosition(position) {
    validatePosition(position);
    const data = await readData();
    if (!data.positions) data.positions = [];
    const newPosition = {
        id: getNextId(data.positions),
        title: position.title.trim(),
        active: position.active !== false
    };
    data.positions.push(newPosition);
    await writeData(data);
    return newPosition;
}

async function updatePosition(id, position) {
    validatePosition(position);
    const data = await readData();
    if (!data.positions) data.positions = [];
    const index = data.positions.findIndex(p => p.id === id);
    if (index === -1) {
        throw notFoundError(`Должность с id=${id} не найдена`);
    }
    const updated = {
        ...data.positions[index],
        title: position.title.trim(),
        active: position.active !== false
    };
    data.positions[index] = updated;
    await writeData(data);
    return updated;
}

async function deletePosition(id) {
    const data = await readData();
    if (!data.positions) data.positions = [];
    const index = data.positions.findIndex(p => p.id === id);
    if (index === -1) {
        throw notFoundError(`Должность с id=${id} не найдена`);
    }
    const usedBy = data.team.filter(m => m.position === data.positions[index].title);
    if (usedBy.length > 0) {
        throw validationError('Нельзя удалить должность, которая используется у сотрудников (' + usedBy.map(m => m.name).join(', ') + ')');
    }
    const [removed] = data.positions.splice(index, 1);
    await writeData(data);
    return removed;
}


function validateBrand(brand) {
    if (!brand || typeof brand !== 'object') {
        throw validationError('Тело запроса должно быть объектом бренда');
    }
    if (typeof brand.src !== 'string' || brand.src.trim() === '') {
        throw validationError('Поле src обязательно и должно быть непустой строкой');
    }
    if (typeof brand.name !== 'string' || brand.name.trim() === '') {
        throw validationError('Поле name обязательно и должно быть непустой строкой');
    }
}

async function addBrand(brand) {
    validateBrand(brand);
    const data = await readData();
    if (!data.brands) data.brands = [];
    const newBrand = {
        id: getNextId(data.brands),
        src: brand.src,
        name: brand.name,
        active: brand.active !== false
    };
    data.brands.push(newBrand);
    await writeData(data);
    return newBrand;
}

async function updateBrand(id, brand) {
    validateBrand(brand);
    const data = await readData();
    if (!data.brands) data.brands = [];
    const index = data.brands.findIndex(b => b.id === id);
    if (index === -1) {
        throw notFoundError(`Бренд с id=${id} не найден`);
    }
    const updated = {
        ...data.brands[index],
        src: brand.src,
        name: brand.name,
        active: brand.active !== false
    };
    data.brands[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteBrand(id) {
    const data = await readData();
    if (!data.brands) data.brands = [];
    const index = data.brands.findIndex(b => b.id === id);
    if (index === -1) {
        throw notFoundError(`Бренд с id=${id} не найден`);
    }
    const [removed] = data.brands.splice(index, 1);
    await writeData(data);
    return removed;
}

function validateWorkItem(item) {
    if (!item || typeof item !== 'object') {
        throw validationError('Тело запроса должно быть объектом карточки офиса');
    }
    if (typeof item.image !== 'string' || item.image.trim() === '') {
        throw validationError('Поле image обязательно и должно быть непустой строкой');
    }
    if (typeof item.caption !== 'string' || item.caption.trim() === '') {
        throw validationError('Поле caption обязательно и должно быть непустой строкой');
    }
}

async function addWorkItem(item) {
    validateWorkItem(item);
    const data = await readData();
    if (!data.work) data.work = [];
    const newItem = {
        id: getNextId(data.work),
        image: item.image,
        caption: item.caption,
        active: item.active !== false
    };
    data.work.push(newItem);
    await writeData(data);
    return newItem;
}

async function updateWorkItem(id, item) {
    validateWorkItem(item);
    const data = await readData();
    if (!data.work) data.work = [];
    const index = data.work.findIndex(w => w.id === id);
    if (index === -1) {
        throw notFoundError(`Карточка офиса с id=${id} не найдена`);
    }
    const updated = {
        ...data.work[index],
        image: item.image,
        caption: item.caption,
        active: item.active !== false
    };
    data.work[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteWorkItem(id) {
    const data = await readData();
    if (!data.work) data.work = [];
    const index = data.work.findIndex(w => w.id === id);
    if (index === -1) {
        throw notFoundError(`Карточка офиса с id=${id} не найдена`);
    }
    const [removed] = data.work.splice(index, 1);
    await writeData(data);
    return removed;
}

function validateTechnology(tech, i) {
    if (!tech || typeof tech !== 'object') {
        throw validationError(`technologies[${i}] должен быть объектом`);
    }
    if (typeof tech.name !== 'string' || tech.name.trim() === '') {
        throw validationError(`technologies[${i}].name обязательно и должно быть непустой строкой`);
    }
    if (typeof tech.icon !== 'string' || tech.icon.trim() === '') {
        throw validationError(`technologies[${i}].icon обязательно и должно быть непустой строкой`);
    }
}

function validateDirection(direction) {
    if (!direction || typeof direction !== 'object') {
        throw validationError('Тело запроса должно быть объектом направления');
    }
    if (typeof direction.title !== 'string' || direction.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (typeof direction.description !== 'string' || direction.description.trim() === '') {
        throw validationError('Поле description обязательно и должно быть непустой строкой');
    }
    if (!Array.isArray(direction.technologies)) {
        throw validationError('Поле technologies должно быть массивом');
    }
    direction.technologies.forEach(validateTechnology);
}

async function addDirection(direction) {
    validateDirection(direction);
    const data = await readData();
    if (!data.directions) data.directions = [];
    const newDirection = {
        id: getNextId(data.directions),
        title: direction.title,
        description: direction.description,
        technologies: direction.technologies.map(t => ({ name: t.name, icon: t.icon })),
        active: direction.active !== false
    };
    data.directions.push(newDirection);
    await writeData(data);
    return newDirection;
}

async function updateDirection(id, direction) {
    validateDirection(direction);
    const data = await readData();
    if (!data.directions) data.directions = [];
    const index = data.directions.findIndex(d => d.id === id);
    if (index === -1) {
        throw notFoundError(`Направление с id=${id} не найдено`);
    }
    const updated = {
        ...data.directions[index],
        title: direction.title,
        description: direction.description,
        technologies: direction.technologies.map(t => ({ name: t.name, icon: t.icon })),
        active: direction.active !== false
    };
    data.directions[index] = updated;
    await writeData(data);
    return updated;
}

async function deleteDirection(id) {
    const data = await readData();
    if (!data.directions) data.directions = [];
    const index = data.directions.findIndex(d => d.id === id);
    if (index === -1) {
        throw notFoundError(`Направление с id=${id} не найдено`);
    }
    const [removed] = data.directions.splice(index, 1);
    await writeData(data);
    return removed;
}

function validateContactForm(form) {
    if (!form || typeof form !== 'object') {
        throw validationError('Тело запроса должно быть объектом контактной формы');
    }
    if (typeof form.title !== 'string' || form.title.trim() === '') {
        throw validationError('Поле title обязательно и должно быть непустой строкой');
    }
    if (typeof form.description !== 'string' || form.description.trim() === '') {
        throw validationError('Поле description обязательно и должно быть непустой строкой');
    }
    if (typeof form.submitLabel !== 'string' || form.submitLabel.trim() === '') {
        throw validationError('Поле submitLabel обязательно и должно быть непустой строкой');
    }
}

async function updateContactForm(form) {
    validateContactForm(form);
    const data = await readData();
    data.contactForm = {
        title: form.title,
        description: form.description,
        submitLabel: form.submitLabel
    };
    await writeData(data);
    return data.contactForm;
}

module.exports = {
    getNextId, updateHero, validationError, notFoundError,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addVacancy, updateVacancy, deleteVacancy,
    addBenefit, updateBenefit, deleteBenefit,
    addGalleryItem, updateGalleryItem, deleteGalleryItem,
    addTimelineItem, updateTimelineItem, deleteTimelineItem,
    getPositions, addPosition, updatePosition, deletePosition,
    addBrand, updateBrand, deleteBrand,
    addWorkItem, updateWorkItem, deleteWorkItem,
    addDirection, updateDirection, deleteDirection,
    updateContactForm
};