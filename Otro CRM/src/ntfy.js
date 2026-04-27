const axios = require('axios');

/**
 * Envía alerta urgente al detective vía ntfy.sh
 * Prioridad máxima: el móvil sonará aunque esté en silencio/No Molestar
 */
async function sendUrgentAlert({ clientPhone, clientName, summary, messageText }) {
  const topic = process.env.NTFY_TOPIC;

  if (!topic) {
    console.error('[ntfy] NTFY_TOPIC no configurado');
    return;
  }

  const title = `⚠️ URGENCIA - ${summary}`;
  const body = [
    `Cliente: ${clientName}`,
    `Teléfono: ${clientPhone}`,
    `Hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
    ``,
    `Mensaje:`,
    messageText.substring(0, 500) // Limitar para no exceder
  ].join('\n');

  try {
    await axios.post(`https://ntfy.sh/${topic}`, body, {
      headers: {
        'Title': title,
        'Priority': '5',           // Máxima prioridad (suena aunque esté en silencio)
        'Tags': 'rotating_light,warning',
        'Actions': `view, Llamar al cliente, tel:${clientPhone}`
      }
    });
    console.log(`[ntfy] Alerta urgente enviada: ${summary}`);
  } catch (err) {
    console.error('[ntfy] Error enviando alerta:', err.message);
  }
}

/**
 * Envía notificación informativa (no urgente) al detective
 * Para casos estándar que requieren seguimiento
 */
async function sendInfoNotification({ clientPhone, clientName, summary }) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  const body = [
    `Cliente: ${clientName}`,
    `Teléfono: ${clientPhone}`,
    `Hora: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
    `Resumen: ${summary}`
  ].join('\n');

  try {
    await axios.post(`https://ntfy.sh/${topic}`, body, {
      headers: {
        'Title': `📋 Nuevo caso - ${summary}`,
        'Priority': '3',           // Prioridad normal
        'Tags': 'memo'
      }
    });
    console.log(`[ntfy] Notificación info enviada: ${summary}`);
  } catch (err) {
    console.error('[ntfy] Error enviando notificación:', err.message);
  }
}

module.exports = { sendUrgentAlert, sendInfoNotification };
