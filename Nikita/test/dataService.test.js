const test = require('node:test');
const assert = require('node:assert');
const { getNextId, addTeamMember, updateHero, addVacancy, addBenefit } = require('../src/dataService');

test('getNextId: пустой массив -> 1', () => {
    assert.strictEqual(getNextId([]), 1);
});

test('getNextId: [1,2,3] -> 4', () => {
    assert.strictEqual(getNextId([{ id: 1 }, { id: 2 }, { id: 3 }]), 4);
});

test('getNextId: с дыркой [1,3] -> 4 (id не переиспользуются)', () => {
    assert.strictEqual(getNextId([{ id: 1 }, { id: 3 }]), 4);
});

test('getNextId: один элемент [5] -> 6', () => {
    assert.strictEqual(getNextId([{ id: 5 }]), 6);
});

test('addTeamMember: без name -> ошибка 400', async () => {
    await assert.rejects(
        () => addTeamMember({ position: 'разработчик' }),
        (err) => err.status === 400
    );
});

test('addTeamMember: name из пробелов -> ошибка 400', async () => {
    await assert.rejects(
        () => addTeamMember({ name: '   ', position: 'разработчик' }),
        (err) => err.status === 400
    );
});

test('updateHero: пустой title -> ошибка 400', async () => {
    await assert.rejects(
        () => updateHero({ title: '   ', stats: [] }),
        (err) => err.status === 400
    );
});

test('updateHero: stats не массив -> ошибка 400', async () => {
    await assert.rejects(
        () => updateHero({ title: 'Заголовок', stats: 'не массив' }),
        (err) => err.status === 400
    );
});

test('addVacancy: без title -> 400', async () => {
    await assert.rejects(
        () => addVacancy({ format: 'удаленно', url: 'https://hh.ru' }),
        (err) => err.status === 400
    );
});

test('addVacancy: url без протокола (hh.ru) -> 400', async () => {
    await assert.rejects(
        () => addVacancy({ title: 'Dev', format: 'удаленно', url: 'hh.ru/vacancy/1' }),
        (err) => err.status === 400
    );
});

test('addVacancy: url не ссылка (мусор) -> 400', async () => {
    await assert.rejects(
        () => addVacancy({ title: 'Dev', format: 'удаленно', url: 'просто текст' }),
        (err) => err.status === 400
    );
});

test('addBenefit: без description -> 400', async () => {
    await assert.rejects(
        () => addBenefit({ title: 'Спорт' }),
        (err) => err.status === 400
    );
});

test('addBenefit: description из пробелов -> 400', async () => {
    await assert.rejects(
        () => addBenefit({ title: 'Спорт', description: '   ' }),
        (err) => err.status === 400
    );
});
