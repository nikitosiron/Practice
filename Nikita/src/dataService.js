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

function validateGalleryItem(item) {
    if (!item || typeof item !== 'object') {
        throw validationError('Тело запроса должно быть объектом карточки галереи');
    }
    if (typeof item.image !== 'string' || item.image.trim() === '') {
        throw validationError('Поле image обязательно и должно быть непустой строкой');
    }
    if (typeof item.caption !== 'string' || item.caption.trim() === '') {
        throw validationError('Поле caption обязательно и должно быть непустой строкой');
    }
}

async function addGalleryItem(item) {
    validateGalleryItem(item);
    const data = await readData();
    const newItem = {
        id: getNextId(data.gallery),
        image: item.image,
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
        image: item.image,
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
        title: position.title.trim()
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
        title: position.title.trim()
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


module.exports = {
    getNextId, updateHero, validationError, notFoundError,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addVacancy, updateVacancy, deleteVacancy,
    addBenefit, updateBenefit, deleteBenefit,
    addGalleryItem, updateGalleryItem, deleteGalleryItem,
    getPositions, addPosition, updatePosition, deletePosition
};