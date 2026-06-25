const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, 'data', 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'travelline_site')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/api/data', (req, res) => {
    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf-8');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (err) {
        console.error('Ошибка чтения data.json:', err);
        res.status(500).json({ success: false, message: 'Не удалось прочитать данные' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});