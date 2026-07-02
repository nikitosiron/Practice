const fs = require('fs/promises');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');

async function readData() {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
}

async function writeData(data) {
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(DATA_PATH, json, 'utf-8');
}

module.exports = { readData, writeData };