const axios = require('axios');

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

/**
 * Envía un mensaje de texto por WhatsApp
 */
async function sendMessage(to, text) {
  const url = `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_ID}/messages`;

  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[WhatsApp] Mensaje enviado a ${to}`);
  } catch (err) {
    console.error('[WhatsApp] Error enviando mensaje:', err.response?.data || err.message);
  }
}

/**
 * Marca un mensaje como leído
 */
async function markAsRead(messageId) {
  const url = `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_ID}/messages`;

  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    // No crítico, solo log
    console.error('[WhatsApp] Error marcando como leído:', err.message);
  }
}

/**
 * Extrae el mensaje de texto del webhook de WhatsApp
 * Retorna null si no es un mensaje de texto válido
 */
function extractMessage(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Ignorar actualizaciones de estado (delivered, read, etc.)
    if (value?.statuses) return null;

    const message = value?.messages?.[0];
    if (!message) return null;

    return {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.type === 'text' ? message.text.body : null,
      name: value.contacts?.[0]?.profile?.name || 'Cliente'
    };
  } catch {
    return null;
  }
}

module.exports = { sendMessage, markAsRead, extractMessage };
