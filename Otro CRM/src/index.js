require('dotenv').config();
const express = require('express');
const db = require('./db'); // <-- NUEVA INTEGRACIÓN: Conexión a la base de datos
const { sendMessage, markAsRead, extractMessage } = require('./whatsapp');
const { chat } = require('./gemini');
const { isOutOfService } = require('./schedule');
const { sendUrgentAlert, sendInfoNotification } = require('./ntfy');

const app = express();
app.use(express.json());

// Control de mensajes procesados para evitar duplicados
const processedMessages = new Set();

// Limpiar mensajes procesados cada hora
setInterval(() => {
  processedMessages.clear();
}, 60 * 60 * 1000);

// ======================
// WEBHOOK VERIFICACIÓN
// ======================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook] Verificación exitosa');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] Verificación fallida');
  return res.sendStatus(403);
});

// ======================
// WEBHOOK MENSAJES
// ======================
app.post('/webhook', async (req, res) => {
  // Responder 200 inmediatamente para que WhatsApp no reenvíe
  res.sendStatus(200);

  try {
    const message = extractMessage(req.body);
    if (!message) return;

    // Evitar procesar duplicados
    if (processedMessages.has(message.messageId)) return;
    processedMessages.add(message.messageId);

    // Solo procesar mensajes de texto por ahora
    if (message.type !== 'text' || !message.text) {
      await sendMessage(
        message.from,
        'Disculpe, de momento solo podemos atender mensajes de texto. ¿Podría escribirnos su consulta?'
      );
      return;
    }

    console.log(`[Bot] Mensaje de ${message.name} (${message.from}): ${message.text.substring(0, 100)}`);

    // Marcar como leído
    await markAsRead(message.messageId);

    // --- INICIO MODIFICACIÓN CRM ---
    // Extraemos el ID del número que está recibiendo el mensaje (útil para multicuenta)
    const botId = req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || process.env.PHONE_NUMBER_ID || 'default_bot';

    // 1. Guardar mensaje del cliente en PostgreSQL de forma segura
    try {
      await db.saveMessage(botId, message.from, 'client', message.text);
    } catch (dbErr) {
      console.error('[DB] Error guardando mensaje del cliente:', dbErr.message);
    }

    // 2. Comprobar si la IA debe responder
    let shouldAiRespond = true; // Si hay fallo, la IA responde por defecto para no dejar al cliente colgado
    try {
      const checkRes = await db.query(
        'SELECT b.global_ai_active, c.bot_active FROM my_bots b LEFT JOIN chats c ON c.bot_id = b.phone_number_id AND c.client_phone = $2 WHERE b.phone_number_id = $1',
        [botId, message.from]
      );
      
      if (checkRes.rows.length > 0) {
        const config = checkRes.rows[0];
        shouldAiRespond = (config.global_ai_active !== false) && (config.bot_active !== false);
      }
    } catch (dbErr) {
      console.error('[DB] Error verificando estado, asumiendo IA activa:', dbErr.message);
    }
    // --- FIN COMPROBACIÓN CRM ---

    // Si la IA está activa, ejecutamos tu flujo normal
    if (shouldAiRespond) {
        // Determinar si estamos fuera de horario
        const offHours = isOutOfService();

        // Enviar a Gemini para obtener respuesta + clasificación
        const response = await chat(
          message.from,
          message.name,
          message.text,
          offHours
        );

        // Enviar respuesta al cliente
        await sendMessage(message.from, response.reply);

        // --- INICIO GUARDADO DE IA ---
        try {
          await db.saveMessage(botId, message.from, 'bot', response.reply);
        } catch (dbErr) {
          console.error('[DB] Error guardando respuesta del bot:', dbErr.message);
        }
        // --- FIN GUARDADO DE IA ---

        // Gestionar alertas según urgencia
        if (response.isUrgent) {
          // URGENTE: alerta máxima al detective
          console.log(`[Bot] ⚠️ CASO URGENTE detectado: ${response.summary}`);
          await sendUrgentAlert({
            clientPhone: message.from,
            clientName: message.name,
            summary: response.summary,
            messageText: message.text
          });
        } else if (response.summary && response.summary !== 'Error técnico') {
          // NO URGENTE: notificación informativa para seguimiento
          await sendInfoNotification({
            clientPhone: message.from,
            clientName: message.name,
            summary: response.summary
          });
        }
    } else {
        // Si desde la web apagamos la IA, solo avisamos en consola
        console.log(`[Bot] ⏸️ IA Pausada para ${message.from}. Esperando intervención manual.`);
    }

  } catch (err) {
    console.error('[Bot] Error procesando mensaje:', err);
  }
});

// ======================
// HEALTH CHECK
// ======================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ======================
// INICIAR SERVIDOR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   Investigalo Detectives - WhatsApp Bot           ║
║   Servidor activo en puerto ${PORT}                 ║
║   Webhook: /webhook                               ║
║   Health:  /health                                ║
╚═══════════════════════════════════════════════════╝
  `);
});