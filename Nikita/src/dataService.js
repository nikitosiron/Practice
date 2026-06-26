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
        vk: member.vk ?? '#'
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
        vk: member.vk ?? data.team[index].vk
    }
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

module.exports = {
    getNextId, updateHero, validationError, notFoundError,
    addTeamMember, updateTeamMember, deleteTeamMember,
};