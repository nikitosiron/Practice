require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcrypt');
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { readData } = require('./src/storage');
const {
    updateHero, addHeroStat, updateHeroStat, deleteHeroStat, ensureHeroStatIds,
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

const ADMIN_LOGIN = process.env.ADMIN_LOGIN;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_LOGIN || !ADMIN_PASSWORD_HASH || !SESSION_SECRET) {
    console.error('В .env не заданы ADMIN_LOGIN / ADMIN_PASSWORD_HASH / SESSION_SECRET');
    process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(session({
    name: 'admin.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,                
        maxAge: 1000 * 60 * 60 * 8    
    }
}));
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use(express.static(path.join(__dirname, 'travelline_site')));

app.use('/admin/login', express.static(path.join(__dirname, 'admin', 'login')));
app.get('/admin/admin.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.css'));
});

app.use('/admin', (req, res, next) => {
    if (req.session && req.session.isAdmin) return next();
    return res.redirect('/admin/login/');
});

app.use('/admin', express.static(path.join(__dirname, 'admin')));

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Требуется авторизация' });
}

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
    limits: { fileSize: 100 * 1024 * 1024 },  
    fileFilter: (req, file, cb) => {
        if (/^(image|video)\//.test(file.mimetype)) return cb(null, true);
        cb(new Error('Разрешены только изображения и видео'));
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { login, password } = req.body || {};
        if (typeof login !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Нужны логин и пароль' });
        }

        const loginOk = login === ADMIN_LOGIN;
        const passwordOk = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

        if (!loginOk || !passwordOk) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error('session.regenerate:', err);
                return res.status(500).json({ success: false, message: 'Ошибка сессии' });
            }
            req.session.isAdmin = true;
            req.session.login = login;
            res.json({ success: true, data: { login } });
        });
    } catch (err) {
        console.error('POST /api/login:', err);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('session.destroy:', err);
            return res.status(500).json({ success: false, message: 'Не удалось выйти' });
        }
        res.clearCookie('admin.sid');
        res.json({ success: true });
    });
});

app.get('/api/me', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({ success: true, data: { login: req.session.login } });
    }
    res.status(401).json({ success: false, message: 'Не авторизован' });
});

app.use('/api', (req, res, next) => {
    if (req.method === 'GET') return next();          
    return requireAuth(req, res, next);               
});

app.post('/api/upload', requireAuth, (req, res) => {
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
        if (!data.contactForm) data.contactForm = { title: '', description: '', submitLabel: '' };
        if (data.hero) ensureHeroStatIds(data.hero);
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

app.post('/api/hero/stats', async (req, res) => {
    try {
        const created = await addHeroStat(req.body);
        res.status(201).json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/hero/stats:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.put('/api/hero/stats/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const updated = await updateHeroStat(id, req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/hero/stats/:id:', err);
        const status = err.status || 500;
        const message = err.status ? err.message : 'Внутренняя ошибка сервера';
        res.status(status).json({ success: false, message });
    }
});

app.delete('/api/hero/stats/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, message: 'id должен быть числом' });
        }
        const removed = await deleteHeroStat(id);
        res.json({ success: true, data: removed });
    } catch (err) {
        console.error('DELETE /api/hero/stats/:id:', err);
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