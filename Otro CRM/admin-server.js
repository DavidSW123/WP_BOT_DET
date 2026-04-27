const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const db = require('./src/db');
const { sendMessage } = require('./src/whatsapp');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

io.on('connection', (socket) => {
    // 1. Cargar bot y devolver lista de contactos + estado global de IA
    socket.on('select_bot', async (botId) => {
        try {
            const botData = await db.query('SELECT global_ai_active FROM my_bots WHERE phone_number_id = $1', [botId]);
            const globalAi = botData.rows[0]?.global_ai_active ?? true;

            const contacts = await db.query(
                'SELECT DISTINCT client_phone, MAX(created_at) as last_time FROM messages WHERE bot_id = $1 GROUP BY client_phone ORDER BY last_time DESC',
                [botId]
            );
            socket.emit('bot_loaded', { contacts: contacts.rows, globalAi });
        } catch (err) { console.error(err); }
    });

    // 2. Cargar chat específico de un cliente
    socket.on('get_chat', async ({ botId, phone }) => {
        try {
            const res = await db.query('SELECT * FROM messages WHERE bot_id = $1 AND client_phone = $2 ORDER BY created_at ASC', [botId, phone]);
            const aiStatus = await db.query('SELECT bot_active FROM chats WHERE bot_id = $1 AND client_phone = $2', [botId, phone]);
            socket.emit('chat_history', { messages: res.rows, bot_active: aiStatus.rows[0]?.bot_active ?? true });
        } catch (err) { console.error(err); }
    });

    // 3. Enviar mensaje
    socket.on('send_manual', async ({ botId, to, text }) => {
        try {
            await sendMessage(to, text);
            await db.saveMessage(botId, to, 'admin', text);
            socket.emit('update_ui'); 
        } catch (err) { console.error(err); }
    });

    // 4. Control de IA (Global e Individual)
    socket.on('toggle_global_ai', async ({ botId, active }) => {
        await db.query('UPDATE my_bots SET global_ai_active = $1 WHERE phone_number_id = $2', [active, botId]);
    });

    socket.on('toggle_local_ai', async ({ botId, phone, active }) => {
        await db.query(`
            INSERT INTO chats (bot_id, client_phone, bot_active) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (bot_id, client_phone) 
            DO UPDATE SET bot_active = $3
        `, [botId, phone, active]);
    });

    // 5. Gestión de Casos (CRM Kanban y Notas)
    socket.on('get_cases', async (botId) => {
        try {
            const res = await db.query('SELECT * FROM cases WHERE bot_id = $1 ORDER BY created_at DESC', [botId]);
            socket.emit('cases_data', res.rows);
        } catch (err) { console.error(err); }
    });

    socket.on('update_case_status', async ({ caseId, status, botId }) => {
        try {
            await db.query('UPDATE cases SET status = $1 WHERE id = $2', [status, caseId]);
            const res = await db.query('SELECT * FROM cases WHERE bot_id = $1 ORDER BY created_at DESC', [botId]);
            socket.emit('cases_data', res.rows);
        } catch (err) { console.error(err); }
    });

    socket.on('save_case_notes', async ({ caseId, notes, botId }) => {
        try {
            await db.query('UPDATE cases SET notes = $1 WHERE id = $2', [notes, caseId]);
            const res = await db.query('SELECT * FROM cases WHERE bot_id = $1 ORDER BY created_at DESC', [botId]);
            socket.emit('cases_data', res.rows);
        } catch (err) { console.error(err); }
    });
});

server.listen(4000, () => console.log('🚀 CRM Profesional en http://localhost:4000'));