const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { readData } = require('./src/storage');
const {
    updateHero,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addVacancy, updateVacancy, deleteVacancy,
    addBenefit, updateBenefit, deleteBenefit,
    addGalleryItem, updateGalleryItem, deleteGalleryItem,
    addTimelineItem, updateTimelineItem, deleteTimelineItem,
    addPosition, updatePosition, deletePosition,
    addBrand, updateBrand, deleteBrand,
    addWorkItem, updateWorkItem, deleteWorkItem,
    addDirection, updateDirection, deleteDirection,
    updateContactForm,
} = require('./src/dataService');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use(express.static(path.join(__dirname, 'travelline_site')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ─── File upload endpoint ─────────────────────────────────
// Accepts image/* or video/* via multipart/form-data (field name "file").
// Saves to travelline_site/upload/user-uploads/ with a random name so we don't
// have to trust the client's originalname (path-traversal, collisions, non-ascii).
// Returns the relative path the client can drop straight into any *.src / *.image
// / *.photo / *.mark field.
const UPLOAD_DIR = path.join(__dirname, 'travelline_site', 'upload', 'user-uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 8);
        const id = crypto.randomUUID().slice(0, 12);
        cb(null, `${Date.now()}-${id}${ext}`);
    }
});

const upload = multer({
    storage: uploadStorage,
    limits: { fileSize: 100 * 1024 * 1024 },  // 100 MB — big enough for the .mp4 gallery clips
    fileFilter: (req, file, cb) => {
        if (/^(image|video)\//.test(file.mimetype)) return cb(null, true);
        cb(new Error('Разрешены только изображения и видео'));
    }
});

app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const status = err instanceof multer.MulterError ? 400 : 400;
            return res.status(status).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Файл не получен (ожидался поле "file")' });
        }
        const relPath = 'upload/user-uploads/' + req.file.filename;
        res.status(201).json({ success: true, data: { src: relPath, size: req.file.size, mimetype: req.file.mimetype } });
    });
});

app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        if (!data.positions) data.positions = [];
        if (!data.gallery) data.gallery = [];
        if (!data.timeline) data.timeline = [];
        if (!data.brands) data.brands = [];
        if (!data.work) data.work = [];
        if (!data.directions) data.directions = [];
        if (!data.contactForm) data.contactForm = { title: '', description: '', directions: [] };
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

app.post('/api/brands', async (req, res) => {
    try {
        const created = await addBrand(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/brands:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/brands/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateBrand(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/brands/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/brands/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteBrand(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/brands/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/work', async (req, res) => {
    try {
        const created = await addWorkItem(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/work:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/work/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateWorkItem(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/work/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/work/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteWorkItem(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/work/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.post('/api/directions', async (req, res) => {
    try {
        const created = await addDirection(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/directions:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/directions/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateDirection(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/directions/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/directions/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteDirection(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/directions/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/contact-form', async (req, res) => {
    try {
        const updated = await updateContactForm(req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/contact-form:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});