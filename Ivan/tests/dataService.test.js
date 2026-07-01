const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');
let originalData;

before(async () => {
    originalData = await fs.readFile(DATA_PATH, 'utf-8');
});

after(async () => {
    await fs.writeFile(DATA_PATH, originalData, 'utf-8');
});

beforeEach(async () => {
    const testData = {
        hero: { title: 'Test title', stats: [{ value: '100', label: 'label1' }] },
        team: [
            { id: 1, name: 'Alice', position: 'Dev', photo: 'a.png', vk: '#', active: true },
            { id: 2, name: 'Bob', position: 'QA', photo: 'b.png', vk: '#', active: false }
        ],
        vacancies: [
            { id: 1, title: 'Frontend', format: 'remote', url: 'https://hh.ru/1', active: true },
            { id: 2, title: 'Backend', format: 'office', url: 'https://hh.ru/2', active: false }
        ],
        benefits: [
            { id: 1, title: 'Sport', description: 'Gym', active: true },
            { id: 2, title: 'Food', description: 'Lunch', active: false }
        ],
        positions: [
            { id: 1, title: 'Dev' },
            { id: 2, title: 'QA' }
        ]
    };
    await fs.writeFile(DATA_PATH, JSON.stringify(testData, null, 2), 'utf-8');
    delete require.cache[require.resolve('../src/dataService')];
    delete require.cache[require.resolve('../src/storage')];
});

function loadService() {
    delete require.cache[require.resolve('../src/dataService')];
    delete require.cache[require.resolve('../src/storage')];
    return require('../src/dataService');
}

describe('readData / writeData', () => {
    it('reads data.json correctly', async () => {
        const { readData } = require('../src/storage');
        const data = await readData();
        assert.equal(data.hero.title, 'Test title');
        assert.equal(data.team.length, 2);
    });

    it('writes and reads back', async () => {
        const { readData, writeData } = require('../src/storage');
        const data = await readData();
        data.hero.title = 'Changed';
        await writeData(data);
        const data2 = await readData();
        assert.equal(data2.hero.title, 'Changed');
    });
});

describe('Team CRUD', () => {
    it('adds a team member', async () => {
        const svc = loadService();
        const member = await svc.addTeamMember({ name: 'Charlie', position: 'PM', photo: 'c.png', vk: '#' });
        assert.equal(member.name, 'Charlie');
        assert.equal(member.id, 3);
        assert.equal(member.active, true);
    });

    it('updates a team member', async () => {
        const svc = loadService();
        const updated = await svc.updateTeamMember(1, { name: 'Alice2', position: 'Lead', photo: 'a2.png', vk: '#', active: false });
        assert.equal(updated.name, 'Alice2');
        assert.equal(updated.active, false);
    });

    it('deletes a team member', async () => {
        const svc = loadService();
        const removed = await svc.deleteTeamMember(1);
        assert.equal(removed.name, 'Alice');
    });

    it('throws on missing name', async () => {
        const svc = loadService();
        await assert.rejects(() => svc.addTeamMember({ name: '', position: 'Dev' }), { message: /name/ });
    });
});

describe('Positions CRUD', () => {
    it('adds a position', async () => {
        const svc = loadService();
        const pos = await svc.addPosition({ title: 'Designer' });
        assert.equal(pos.title, 'Designer');
        assert.equal(pos.id, 3);
    });

    it('updates a position', async () => {
        const svc = loadService();
        const updated = await svc.updatePosition(1, { title: 'Senior Dev' });
        assert.equal(updated.title, 'Senior Dev');
    });

    it('deletes an unused position', async () => {
        const svc = loadService();
        await svc.addPosition({ title: 'Unused' });
        const positions = await svc.getPositions();
        const unusedId = positions.find(p => p.title === 'Unused').id;
        const removed = await svc.deletePosition(unusedId);
        assert.equal(removed.title, 'Unused');
    });

    it('prevents deleting a position used by team members', async () => {
        const svc = loadService();
        await assert.rejects(() => svc.deletePosition(1), { message: /используется/ });
    });

    it('throws on empty title', async () => {
        const svc = loadService();
        await assert.rejects(() => svc.addPosition({ title: '' }), { message: /title/ });
    });
});

describe('Active field compatibility', () => {
    it('treats missing active as active (team)', async () => {
        const { readData, writeData } = require('../src/storage');
        const data = await readData();
        delete data.team[0].active;
        await writeData(data);
        const data2 = await readData();
        assert.equal(data2.team[0].active !== false, true);
    });

    it('treats missing active as active (vacancies)', async () => {
        const { readData, writeData } = require('../src/storage');
        const data = await readData();
        delete data.vacancies[0].active;
        await writeData(data);
        const data2 = await readData();
        assert.equal(data2.vacancies[0].active !== false, true);
    });

    it('treats missing active as active (benefits)', async () => {
        const { readData, writeData } = require('../src/storage');
        const data = await readData();
        delete data.benefits[0].active;
        await writeData(data);
        const data2 = await readData();
        assert.equal(data2.benefits[0].active !== false, true);
    });

    it('filters inactive records for public page', async () => {
        const { readData } = require('../src/storage');
        const data = await readData();
        var activeTeam = data.team.filter(function (item) { return item.active !== false; });
        var activeVacancies = data.vacancies.filter(function (item) { return item.active !== false; });
        var activeBenefits = data.benefits.filter(function (item) { return item.active !== false; });

        assert.equal(activeTeam.length, 1);
        assert.equal(activeVacancies.length, 1);
        assert.equal(activeBenefits.length, 1);
    });
});

describe('Vacancies', () => {
    it('rejects invalid URL', async () => {
        const svc = loadService();
        await assert.rejects(
            () => svc.addVacancy({ title: 'Test', format: 'remote', url: 'not-a-url' }),
            { message: /url/ }
        );
    });
});

describe('Missing positions array', () => {
    it('works when positions is missing from data.json', async () => {
        const { readData, writeData } = require('../src/storage');
        const data = await readData();
        delete data.positions;
        await writeData(data);

        const svc = loadService();
        const positions = await svc.getPositions();
        assert.deepEqual(positions, []);
    });
});