const express = require('express');
const path = require('path');
const { readData } = require('./src/storage');
const {
    updateHero,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addVacancy, updateVacancy, deleteVacancy,
    addBenefit, updateBenefit, deleteBenefit,
    addGalleryItem, updateGalleryItem, deleteGalleryItem,
    addTimelineItem, updateTimelineItem, deleteTimelineItem,
    addPosition, updatePosition, deletePosition,
} = require('./src/dataService');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'travelline_site')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        if (!data.positions) data.positions = [];
        if (!data.gallery) data.gallery = [];
        if (!data.timeline) data.timeline = [];
        res.json(data);
    } catch (err) {
        console.error('Ошибка чтения data.json:', err);
        res.status(500).json({ success: false, message: 'Не удалось прочитать данные' });
    }
});

app.put('/api/hero', async (req, res) => {
    try {
        const updated = await updateHero(req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/hero:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/team', async (req, res) => {
    try {
        const created = await addTeamMember(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/team:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/team/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateTeamMember(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/team/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/team/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteTeamMember(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/team/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/vacancies', async (req, res) => {
    try {
        const created = await addVacancy(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/vacancies:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/vacancies/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateVacancy(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/vacancies/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/vacancies/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteVacancy(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/vacancies/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/benefits', async (req, res) => {
    try {
        const created = await addBenefit(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/benefits:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/benefits/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateBenefit(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/benefits/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/benefits/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteBenefit(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/benefits/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/gallery', async (req, res) => {
    try {
        const created = await addGalleryItem(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/gallery:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/gallery/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) { 
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateGalleryItem(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/gallery/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/gallery/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteGalleryItem(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/gallery/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/timeline', async (req, res) => {
    try {
        const created = await addTimelineItem(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/timeline:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/timeline/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateTimelineItem(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/timeline/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/timeline/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteTimelineItem(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/timeline/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.get('/api/positions', async (req, res) => {
    try {
        const data = await readData();
        res.json({ success: true, data: data.positions || [] });
    } catch (err) {
        console.error('GET /api/positions:', err);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/positions', async (req, res) => {
    try {
        const created = await addPosition(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/positions:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/positions/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updatePosition(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/positions/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/positions/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deletePosition(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/positions/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});