const axios = require('axios');
const db = require('../models/db');

const API = 'https://graph.facebook.com/v25.0';
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

// Enviar mensaje
async function sendMessage(to, text) {
  try {
    const response = await axios.post(`${API}/${PHONE_ID}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
    });
    console.log(`[Meta] Mensaje enviado a ${to}`);
    return response.data;
  } catch (err) {
    console.error('[Meta] Error enviando:', err.response?.data || err.message);
    throw err;
  }
}

// Procesar webhook (mensaje recibido)
async function handleIncomingMessage(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.statuses) return; // Ignorar actualizaciones de estado

    const message = value?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const phone = message.from;
    const text = message.text.body;
    const name = value?.contacts?.[0]?.profile?.name || 'Cliente';

    // Verificar/crear contacto
    let contact = await db.getContact(phone);
    if (contact.rows.length === 0) {
      contact = await db.createContact(phone, name);
    }
    const contactId = contact.rows[0].id;

    // Verificar/crear conversación
    let conv = await db.getConversation(contactId);
    if (conv.rows.length === 0) {
      conv = await db.createConversation(contactId);
    }
    const conversationId = conv.rows[0].id;

    // Guardar mensaje
    await db.saveMessage(conversationId, 'in', text, false);

    // Verificar estado del bot
    const botStatus = await db.getBotStatus(conversationId);
    const botEnabled = botStatus.rows.length ? botStatus.rows[0].enabled : true;

    return { conversationId, contactId, phone, text, name, botEnabled };
  } catch (err) {
    console.error('[Meta] Error procesando mensaje:', err.message);
  }
}

// Obtener conversaciones de Meta (opcional - sincronizar)
async function getConversations() {
  try {
    const response = await axios.get(`${API}/me/conversations`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return response.data.data;
  } catch (err) {
    console.error('[Meta] Error obteniendo conversaciones:', err.message);
  }
}

module.exports = { sendMessage, handleIncomingMessage, getConversations };
