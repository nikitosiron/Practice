const express = require('express');
const path = require('path');
const { readData } = require('./src/storage');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'travelline_site')));

app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (err) {
        console.error('Ошибка чтения data.json:', err);
        res.status(500).json({ success: false, message: 'Не удалось прочитать данные' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});