const test = require('node:test');
const assert = require('node:assert');
const { getNextId, addTeamMember, updateHero, addHeroStat, updateHeroStat, deleteHeroStat, addVacancy, addBenefit, addGalleryItem, addTimelineItem, addPosition, addBrand, addWorkItem, addDirection, updateContactForm } = require('../src/dataService');

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

test('addHeroStat: без value -> ошибка 400', async () => {
    await assert.rejects(
        () => addHeroStat({ label: 'подпись' }),
        (err) => err.status === 400
    );
});

test('addHeroStat: без label -> ошибка 400', async () => {
    await assert.rejects(
        () => addHeroStat({ value: '300+' }),
        (err) => err.status === 400
    );
});

test('updateHeroStat: не существующий id -> ошибка 404', async () => {
    await assert.rejects(
        () => updateHeroStat(999999, { value: 'v', label: 'l' }),
        (err) => err.status === 404
    );
});

test('deleteHeroStat: не существующий id -> ошибка 404', async () => {
    await assert.rejects(
        () => deleteHeroStat(999999),
        (err) => err.status === 404
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

test('addGalleryItem: без caption -> 400', async () => {
    await assert.rejects(
        () => addGalleryItem({ src: 'upload/iblock/x.png', type: 'image' }),
        (err) => err.status === 400
    );
});

test('addGalleryItem: src из пробелов -> 400', async () => {
    await assert.rejects(
        () => addGalleryItem({ src: '   ', type: 'image', caption: 'подпись' }),
        (err) => err.status === 400
    );
});

test('addGalleryItem: type XYZ -> 400', async () => {
    await assert.rejects(
        () => addGalleryItem({ src: 'upload/iblock/x.png', type: 'XYZ', caption: 'подпись' }),
        (err) => err.status === 400
    );
});

test('addTimelineItem: year вне диапазона (1500) -> 400', async () => {
    await assert.rejects(
        () => addTimelineItem({
            type: 'product', year: 1500, title: 'X', strategy: 'B2B',
            subtitle: 'sub', text: 'desc'
        }),
        (err) => err.status === 400
    );
});

test('addTimelineItem: strategy вне enum ("XYZ") -> 400', async () => {
    await assert.rejects(
        () => addTimelineItem({
            type: 'product', year: 2020, title: 'X', strategy: 'XYZ',
            subtitle: 'sub', text: 'desc'
        }),
        (err) => err.status === 400
    );
});

test('addTimelineItem: без text -> 400', async () => {
    await assert.rejects(
        () => addTimelineItem({
            type: 'product', year: 2020, title: 'X', strategy: 'B2B', subtitle: 'sub'
        }),
        (err) => err.status === 400
    );
});

test('addTimelineItem: без type -> 400', async () => {
    await assert.rejects(
        () => addTimelineItem({
            year: 2020, title: 'X', strategy: 'B2B', subtitle: 'sub', text: 'desc'
        }),
        (err) => err.status === 400
    );
});

test('addPosition: без title -> 400', async () => {
    await assert.rejects(
        () => addPosition({}),
        (err) => err.status === 400
    );
});

test('addPosition: title из пробелов -> 400', async () => {
    await assert.rejects(
        () => addPosition({ title: '   ' }),
        (err) => err.status === 400
    );
});

test('addBrand: без name -> 400', async () => {
    await assert.rejects(
        () => addBrand({ src: 'local/x.svg' }),
        (err) => err.status === 400
    );
});

test('addBrand: src из пробелов -> 400', async () => {
    await assert.rejects(
        () => addBrand({ src: '   ', name: 'Cosmos' }),
        (err) => err.status === 400
    );
});

test('addWorkItem: без caption -> 400', async () => {
    await assert.rejects(
        () => addWorkItem({ image: 'upload/x.jpg' }),
        (err) => err.status === 400
    );
});

test('addWorkItem: image из пробелов -> 400', async () => {
    await assert.rejects(
        () => addWorkItem({ image: '   ', caption: 'офис' }),
        (err) => err.status === 400
    );
});

test('addDirection: technologies не массив -> 400', async () => {
    await assert.rejects(
        () => addDirection({ title: 'X', description: 'desc', technologies: 'not array' }),
        (err) => err.status === 400
    );
});

test('addDirection: technologies с пустым name -> 400', async () => {
    await assert.rejects(
        () => addDirection({
            title: 'X', description: 'desc',
            technologies: [{ name: '   ', icon: 'i.png' }]
        }),
        (err) => err.status === 400
    );
});

test('addDirection: без description -> 400', async () => {
    await assert.rejects(
        () => addDirection({ title: 'X', technologies: [] }),
        (err) => err.status === 400
    );
});

test('updateContactForm: пустой submitLabel -> 400', async () => {
    await assert.rejects(
        () => updateContactForm({ title: 'X', description: 'D', submitLabel: '   ' }),
        (err) => err.status === 400
    );
});

test('updateContactForm: без submitLabel -> 400', async () => {
    await assert.rejects(
        () => updateContactForm({ title: 'X', description: 'D' }),
        (err) => err.status === 400
    );
});
